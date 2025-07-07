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

    // Create subscription with trial status
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

    // For trial subscriptions, we don't need immediate payment
    // Mollie subscription will be created when trial ends or user wants to activate early
    
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

    this.logger.log(`Trial subscription created successfully: ${savedSubscription.id}`);
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
      // For Mollie, we need to handle subscription changes through payment provider
      // This might involve creating a new subscription and canceling the old one
      this.logger.log(`Plan change detected: ${subscription.plan.name} -> ${dto.planName}`);
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
      // Return empty usage data when no subscription exists
      return {
        usage: {
          cars_washed: 0,
          active_users: 0,
          active_locations: 0,
        },
        limits: {
          cars: { current: 0, limit: null, percentage: 0 },
          users: { current: 0, limit: null, percentage: 0 },
          locations: { current: 0, limit: null, percentage: 0 },
        },
        warnings: {
          warning: false,
          critical: false,
          messages: [],
        },
      };
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

  /**
   * Change subscription plan with payment processing
   * This creates a checkout URL for the user to complete payment
   */
  async changeSubscriptionPlan(
    tenantId: string,
    subscriptionId: string,
    newPlanName: PlanName,
    returnUrl: string,
    billingInterval?: BillingInterval,
  ): Promise<{ checkoutUrl: string; subscription: Subscription }> {
    this.logger.log(`Changing subscription ${subscriptionId} to plan ${newPlanName}`);

    // Get current subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId, tenantId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Get new plan
    const newPlan = await this.planRepository.findOne({
      where: { name: newPlanName, isActive: true },
    });

    if (!newPlan) {
      throw new NotFoundException('New subscription plan not found');
    }

    // Use the new billing interval if provided, otherwise keep the current one
    const newBillingInterval = billingInterval || subscription.billingInterval;
    
    // Calculate the amount to charge based on the new billing interval
    const amount = newBillingInterval === BillingInterval.YEAR 
      ? parseFloat(newPlan.priceYearly.toString()) 
      : parseFloat(newPlan.priceMonthly.toString());

    // Create a one-time payment for the subscription change
    try {
      // First ensure we have a Mollie customer for this tenant
      const customer = await this.paymentsService.getOrCreateCustomer(tenantId, {
        email: `tenant-${tenantId}@garage.example.com`, // This should come from tenant data
        metadata: { tenantId, action: 'subscription_change' },
      });

      // Create payment for the new plan
      const payment = await this.paymentsService.createCheckoutPayment({
        amount,
        currency: 'EUR',
        description: `Subscription upgrade to ${newPlan.displayName}`,
        customerId: customer.id,
        redirectUrl: returnUrl,
        webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
        metadata: {
          tenantId,
          subscriptionId,
          newPlanName,
          newBillingInterval,
          action: 'subscription_change',
        },
      });

      // Audit log subscription change attempt
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_CHANGE_INITIATED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          currentPlan: subscription.plan.name,
          newPlan: newPlanName,
          amount,
          paymentId: payment.id,
        },
        tenant_id: tenantId,
      });

      return {
        checkoutUrl: payment.checkoutUrl,
        subscription,
      };
    } catch (error) {
      this.logger.error('Failed to create subscription change payment', error);
      throw new BadRequestException('Failed to initiate subscription change');
    }
  }

  /**
   * Create a paid subscription with Mollie checkout
   * This skips the trial and requires immediate payment
   */
  async createPaidSubscription(
    tenantId: string,
    dto: CreateSubscriptionDto & { returnUrl: string },
  ): Promise<{ checkoutUrl: string; subscription: Subscription }> {
    this.logger.log(`Creating paid subscription for tenant ${tenantId} with plan ${dto.planName}`);

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

    // Calculate the amount to charge (convert from decimal string to number)
    const amount = dto.billingInterval === BillingInterval.YEAR 
      ? parseFloat(plan.priceYearly.toString()) 
      : parseFloat(plan.priceMonthly.toString());

    try {
      // First ensure we have a Mollie customer for this tenant
      const customer = await this.paymentsService.getOrCreateCustomer(tenantId, {
        email: `tenant-${tenantId}@garage.example.com`, // This should come from tenant data
        metadata: { tenantId, action: 'new_subscription' },
      });

      // Create payment for the subscription
      const payment = await this.paymentsService.createCheckoutPayment({
        amount,
        currency: 'EUR',
        description: `${plan.displayName} subscription - ${dto.billingInterval === BillingInterval.YEAR ? 'Yearly' : 'Monthly'}`,
        customerId: customer.id,
        redirectUrl: dto.returnUrl,
        webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
        metadata: {
          tenantId,
          planName: dto.planName,
          billingInterval: dto.billingInterval,
          action: 'new_subscription',
        },
      });

      // Create subscription in pending state
      const now = new Date();
      const currentPeriodEnd = new Date(now);
      
      // Set period end based on billing interval
      if (dto.billingInterval === BillingInterval.YEAR) {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      const subscription = this.subscriptionRepository.create({
        tenantId,
        planId: plan.id,
        paymentMethodId: dto.paymentMethodId,
        status: SubscriptionStatus.INCOMPLETE, // Will be activated after payment
        billingInterval: dto.billingInterval || BillingInterval.MONTH,
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
        metadata: {
          ...dto.metadata,
          pendingPaymentId: payment.id,
        },
      });

      const savedSubscription = await this.subscriptionRepository.save(subscription);

      // Audit log subscription creation attempt
      await this.auditService.logAction({
        action: 'PAID_SUBSCRIPTION_INITIATED',
        resource_type: 'Subscription',
        resource_id: savedSubscription.id,
        details: {
          planName: dto.planName,
          billingInterval: dto.billingInterval,
          amount,
          paymentId: payment.id,
        },
        tenant_id: tenantId,
      });

      return {
        checkoutUrl: payment.checkoutUrl,
        subscription: savedSubscription,
      };
    } catch (error) {
      this.logger.error('Failed to create paid subscription', error);
      throw new BadRequestException('Failed to initiate subscription payment');
    }
  }

  /**
   * Complete new subscription after successful payment
   * This should be called from the webhook handler
   */
  async completeNewSubscription(paymentId: string): Promise<Subscription> {
    this.logger.log(`Completing new subscription for payment ${paymentId}`);

    try {
      // Get payment details
      const payment = await this.paymentsService.getPayment(paymentId);
      
      if (payment.status !== 'paid') {
        throw new BadRequestException('Payment not completed');
      }

      const metadata = payment.metadata;
      const tenantId = metadata.tenantId;

      // Find subscription with this payment ID
      // Note: TypeORM doesn't support JSON queries in where clause directly
      // We need to find all subscriptions for the tenant and filter
      const subscriptions = await this.subscriptionRepository.find({
        where: { 
          tenantId,
          status: SubscriptionStatus.INCOMPLETE,
        },
        relations: ['plan'],
      });

      const subscription = subscriptions.find(
        sub => sub.metadata?.pendingPaymentId === paymentId
      );

      if (!subscription) {
        throw new NotFoundException('Subscription not found for payment');
      }

      // Activate subscription
      const now = new Date();
      const periodEnd = new Date(now);
      
      if (subscription.billingInterval === BillingInterval.YEAR) {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.providerSubscriptionId = payment.id; // If available
      subscription.metadata = {
        ...subscription.metadata,
        activatedAt: now.toISOString(),
        activationPaymentId: paymentId,
      };
      delete subscription.metadata.pendingPaymentId;

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Audit log successful subscription activation
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_ACTIVATED',
        resource_type: 'Subscription',
        resource_id: subscription.id,
        details: {
          plan: subscription.plan.name,
          paymentId,
          amount: payment.amount,
        },
        tenant_id: tenantId,
      });

      this.logger.log(`Subscription ${subscription.id} successfully activated`);
      
      return updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to complete new subscription', error);
      throw error;
    }
  }

  /**
   * Complete subscription plan change after successful payment
   * This should be called from the webhook handler
   */
  async completeSubscriptionChange(paymentId: string): Promise<Subscription> {
    this.logger.log(`Completing subscription change for payment ${paymentId}`);

    try {
      // Get payment details
      const payment = await this.paymentsService.getPayment(paymentId);
      
      this.logger.log(`Payment status for ${paymentId}: ${payment.status}`);
      this.logger.log(`Payment metadata: ${JSON.stringify(payment.metadata)}`);
      
      if (payment.status !== 'paid') {
        throw new BadRequestException('Payment not completed');
      }

      const metadata = payment.metadata;
      const subscriptionId = metadata.subscriptionId;
      const newPlanName = metadata.newPlanName as PlanName;
      const tenantId = metadata.tenantId;
      const newBillingInterval = metadata.newBillingInterval as BillingInterval;

      // Get subscription and new plan
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId, tenantId },
        relations: ['plan'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const newPlan = await this.planRepository.findOne({
        where: { name: newPlanName, isActive: true },
      });

      if (!newPlan) {
        throw new NotFoundException('New subscription plan not found');
      }

      // Update subscription
      const oldPlanName = subscription.plan.name;
      const oldPlanId = subscription.planId;
      const oldStatus = subscription.status;
      
      this.logger.log(`Before update - Plan ID: ${oldPlanId}, Status: ${oldStatus}`);
      
      subscription.planId = newPlan.id;
      subscription.plan = newPlan; // Update the relation object as well
      
      // Update billing interval if provided
      if (newBillingInterval) {
        subscription.billingInterval = newBillingInterval;
      }
      
      // Update status to ACTIVE if it was INCOMPLETE
      if (subscription.status === SubscriptionStatus.INCOMPLETE) {
        subscription.status = SubscriptionStatus.ACTIVE;
      }
      
      // Reset billing period for the new plan
      const now = new Date();
      subscription.currentPeriodStart = now;
      
      if (subscription.billingInterval === BillingInterval.YEAR) {
        subscription.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      } else {
        subscription.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      }
      
      this.logger.log(`After update - Plan ID: ${subscription.planId}, Status: ${subscription.status}`)

      const updatedSubscription = await this.subscriptionRepository.save(subscription);

      // Reload the subscription with the new plan relation
      const reloadedSubscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
        relations: ['plan'],
      });

      // Audit log successful subscription change
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_CHANGED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          oldPlan: oldPlanName,
          newPlan: newPlanName,
          paymentId,
          amount: payment.amount,
        },
        tenant_id: tenantId,
      });

      this.logger.log(`Subscription ${subscriptionId} successfully changed from ${oldPlanName} to ${newPlanName}`);
      this.logger.log(`New plan ID: ${subscription.planId}, Status: ${subscription.status}`);
      
      return reloadedSubscription || updatedSubscription;
    } catch (error) {
      this.logger.error('Failed to complete subscription change', error);
      throw error;
    }
  }
}