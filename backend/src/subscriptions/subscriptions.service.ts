import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus, BillingInterval } from './entities/subscription.entity';
import { SubscriptionPlan, PlanName } from './entities/subscription-plan.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PaymentsService } from '../payments/payments.service';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @Inject(forwardRef(() => PaymentsService))
    private paymentsService: PaymentsService,
    private usageService: UsageService,
    private limitsService: LimitsService,
    private auditService: AuditService,
  ) {}

  async createSubscription(
    tenantId: string,
    dto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    this.logger.log(`Creating subscription for tenant ${tenantId} with plan ${dto.planName}`);

    // Check if tenant already has a subscription
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: { tenantId },
    });

    if (existingSubscription) {
      throw new BadRequestException('Tenant already has a subscription');
    }

    // Get the plan
    const plan = await this.planRepository.findOne({
      where: { name: dto.planName, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Calculate billing period
    const now = new Date();
    const periodEnd = new Date(now);
    if (dto.billingInterval === BillingInterval.YEAR) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Create subscription
    const subscription = this.subscriptionRepository.create({
      tenantId,
      planId: plan.id,
      paymentMethodId: dto.paymentMethodId,
      status: SubscriptionStatus.TRIALING, // Start with trial
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      billingInterval: dto.billingInterval || BillingInterval.MONTH,
      trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      metadata: dto.metadata || {},
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    // TODO: Create subscription in payment provider (Mollie)
    // const mollieSubscription = await this.paymentsService.createSubscription(...)

    // Audit log subscription creation
    await this.auditService.logAction({
      action: 'SUBSCRIPTION_CREATED',
      resource_type: 'Subscription',
      resource_id: savedSubscription.id,
      details: {
        planName: dto.planName,
        billingInterval: dto.billingInterval,
        status: savedSubscription.status,
        trialEnd: savedSubscription.trialEnd,
      },
      tenant_id: tenantId,
    });

    this.logger.log(`Subscription created successfully: ${savedSubscription.id}`);
    return savedSubscription;
  }

  async getCurrentSubscription(tenantId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { tenantId },
      relations: ['plan'],
    });
  }

  async updateSubscription(
    tenantId: string,
    subscriptionId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Handle plan change
    if (dto.planName && dto.planName !== subscription.plan.name) {
      const newPlan = await this.planRepository.findOne({
        where: { name: dto.planName, isActive: true },
      });

      if (!newPlan) {
        throw new NotFoundException('New subscription plan not found');
      }

      subscription.planId = newPlan.id;
      // TODO: Handle proration and billing adjustments
    }

    // Update other fields
    if (dto.paymentMethodId) {
      subscription.paymentMethodId = dto.paymentMethodId;
    }

    if (dto.billingInterval) {
      subscription.billingInterval = dto.billingInterval;
    }

    if (dto.cancelAtPeriodEnd !== undefined) {
      subscription.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;
      if (dto.cancelAtPeriodEnd) {
        subscription.canceledAt = new Date();
      } else {
        subscription.canceledAt = undefined;
      }
    }

    if (dto.metadata) {
      subscription.metadata = { ...subscription.metadata, ...dto.metadata };
    }

    const updatedSubscription = await this.subscriptionRepository.save(subscription);

    // Audit log subscription update
    await this.auditService.logAction({
      action: 'SUBSCRIPTION_UPDATED',
      resource_type: 'Subscription',
      resource_id: subscriptionId,
      details: {
        changes: dto,
        newPlanName: dto.planName,
        cancelAtPeriodEnd: dto.cancelAtPeriodEnd,
      },
      tenant_id: tenantId,
    });

    return updatedSubscription;
  }

  async cancelSubscription(
    tenantId: string,
    subscriptionId: string,
    immediately = false,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (immediately) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
      subscription.canceledAt = new Date();
    }

    // TODO: Cancel subscription in payment provider

    const canceledSubscription = await this.subscriptionRepository.save(subscription);

    // Audit log subscription cancellation
    await this.auditService.logAction({
      action: 'SUBSCRIPTION_CANCELED',
      resource_type: 'Subscription',
      resource_id: subscriptionId,
      details: {
        immediately,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      },
      tenant_id: tenantId,
    });

    return canceledSubscription;
  }

  async reactivateSubscription(
    tenantId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.status !== SubscriptionStatus.CANCELED && !subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('Subscription is not canceled');
    }

    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.cancelAtPeriodEnd = false;
    subscription.canceledAt = undefined;

    // TODO: Reactivate subscription in payment provider

    return await this.subscriptionRepository.save(subscription);
  }

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return await this.planRepository.find({
      where: { isActive: true },
      order: { priceMonthly: 'ASC' },
    });
  }

  async getPlan(planId: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepository.findOne({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async getCurrentUsage(tenantId: string): Promise<any> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    const usage = await this.usageService.getCurrentPeriodUsage(subscription.id);
    const limits = await this.limitsService.getAllLimits(subscription.id);
    const warnings = await this.limitsService.getLimitWarnings(subscription.id);

    return {
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      usage,
      limits,
      warnings,
    };
  }

  async recordUsage(tenantId: string, metricType: any, quantity: number, metadata?: any): Promise<void> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) {
      this.logger.warn(`No subscription found for tenant ${tenantId}, skipping usage recording`);
      return;
    }

    await this.usageService.recordUsage(subscription.id, {
      metricType,
      quantity,
      metadata,
    });
  }

  // Helper methods for common operations
  async recordCarWash(tenantId: string, metadata?: any): Promise<void> {
    return this.recordUsage(tenantId, 'cars_washed', 1, metadata);
  }

  async recordActiveUser(tenantId: string, userId: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) return;

    await this.usageService.recordActiveUser(subscription.id, userId);
  }

  async recordActiveLocation(tenantId: string, locationId: string): Promise<void> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) return;

    await this.usageService.recordActiveLocation(subscription.id, locationId);
  }

  async checkLimit(tenantId: string, metricType: any): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) return true; // Allow if no subscription (for trials)

    const check = await this.limitsService.checkLimit(subscription.id, metricType);
    return check.allowed;
  }

  async hasFeature(tenantId: string, featureName: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) return false;

    return this.limitsService.hasFeature(subscription.id, featureName);
  }
}