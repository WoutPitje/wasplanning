import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription, SubscriptionStatus, BillingInterval } from './entities/subscription.entity';
import { SubscriptionPlan, PlanName } from './entities/subscription-plan.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { PaymentsService } from '../payments/payments.service';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { ProrationService } from './services/proration.service';
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
    private prorationService: ProrationService,
    private configService: ConfigService,
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
      trialEnd: new Date(Date.now() + this.getTrialDays() * 24 * 60 * 60 * 1000),
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

    // Cancel Mollie subscription if exists
    if (subscription.mollieSubscriptionId) {
      try {
        await this.paymentsService.cancelSubscription(subscription.mollieSubscriptionId);
        this.logger.log(`Cancelled Mollie subscription ${subscription.mollieSubscriptionId}`);
      } catch (error) {
        this.logger.error(`Failed to cancel Mollie subscription: ${error.message}`);
        // Continue with local cancellation even if Mollie fails
      }
    }

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

    // Cannot reactivate cancelled Mollie subscriptions
    // Need to create a new subscription
    if (subscription.mollieSubscriptionId) {
      this.logger.warn('Cannot reactivate cancelled Mollie subscription, user needs to create new subscription');
      throw new BadRequestException('Cancelled subscriptions cannot be reactivated. Please create a new subscription.');
    }

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
        creditBalance: Number(subscription.creditBalance || 0),
        billingInterval: subscription.billingInterval,
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

  async getCreditBalance(tenantId: string): Promise<{
    currentBalance: number;
    transactions: Array<{
      date: string;
      type: 'earned' | 'used';
      amount: number;
      description: string;
      relatedPlan?: string;
    }>;
  }> {
    const subscription = await this.getCurrentSubscription(tenantId);
    if (!subscription) {
      return {
        currentBalance: 0,
        transactions: [],
      };
    }

    // Get credit transactions from audit logs
    const auditLogs = await this.auditService.findByResourceId(subscription.id);
    
    const creditTransactions = auditLogs
      .filter(log => 
        log.action.includes('DOWNGRADE') || 
        log.action.includes('CREDIT') || 
        log.action.includes('UPGRADED_WITH_CREDIT')
      )
      .map(log => {
        const details = log.details as any;
        let type: 'earned' | 'used' = 'earned';
        let amount = 0;
        let description = '';

        if (log.action === 'SUBSCRIPTION_DOWNGRADED') {
          type = 'earned';
          amount = details.credit || 0;
          description = `Credit from downgrade: ${details.oldPlan} → ${details.newPlan}`;
        } else if (log.action === 'SUBSCRIPTION_UPGRADED_WITH_CREDIT') {
          type = 'used';
          amount = details.creditUsed || 0;
          description = `Credit used for upgrade: ${details.oldPlan} → ${details.newPlan}`;
        }

        return {
          date: log.created_at.toISOString(),
          type,
          amount,
          description,
          relatedPlan: details.newPlan || details.oldPlan,
        };
      })
      .filter(transaction => transaction.amount > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      currentBalance: Number(subscription.creditBalance || 0),
      transactions: creditTransactions,
    };
  }

  /**
   * Preview plan change costs and credit usage without creating payment
   */
  async previewPlanChange(
    tenantId: string,
    subscriptionId: string,
    newPlanName: PlanName,
    billingInterval?: BillingInterval,
  ): Promise<{
    currentPlan: SubscriptionPlan;
    newPlan: SubscriptionPlan;
    proration: any;
    creditBreakdown: {
      currentBalance: number;
      willBeUsed: number;
      willRemain: number;
      additionalPayment: number;
    };
  }> {
    this.logger.log(`Previewing plan change for subscription ${subscriptionId} to ${newPlanName}`);

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
    
    // Calculate proration for the plan change
    const proration = this.prorationService.calculateProration(
      subscription,
      subscription.plan,
      newPlan,
      newBillingInterval,
    );

    // Calculate credit breakdown
    const existingCredit = Number(subscription.creditBalance || 0);
    let creditToUse = 0;
    let remainingCredit = existingCredit;
    let additionalPayment = proration.amount;

    if (proration.isUpgrade && existingCredit > 0 && proration.amount > 0) {
      creditToUse = Math.min(existingCredit, proration.amount);
      remainingCredit = existingCredit - creditToUse;
      additionalPayment = Math.max(0, proration.amount - creditToUse);
    } else if (!proration.isUpgrade) {
      // For downgrades, add to existing credit
      remainingCredit = existingCredit + proration.credit;
      additionalPayment = 0;
    }

    return {
      currentPlan: subscription.plan,
      newPlan,
      proration: {
        ...proration,
        daysRemaining: proration.daysRemaining,
        description: proration.description,
        isUpgrade: proration.isUpgrade,
        originalAmount: proration.amount,
        creditAmount: proration.credit,
      },
      creditBreakdown: {
        currentBalance: existingCredit,
        willBeUsed: creditToUse,
        willRemain: remainingCredit,
        additionalPayment,
      },
    };
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
    
    // Calculate proration for the plan change
    const proration = this.prorationService.calculateProration(
      subscription,
      subscription.plan,
      newPlan,
      newBillingInterval,
    );

    // Add existing credit info
    const existingCredit = Number(subscription.creditBalance || 0);
    proration.existingCredit = existingCredit;

    this.logger.log(`Proration result: ${JSON.stringify(proration)}`);
    this.logger.log(`Existing credit balance: €${existingCredit}`);

    // If downgrade (credit), update subscription immediately without payment
    if (!proration.isUpgrade && proration.credit > 0) {
      this.logger.log(`Downgrade detected - applying ${proration.credit} credit`);
      
      // Store the old plan name before updating
      const oldPlanName = subscription.plan.name;
      
      // Update subscription
      subscription.planId = newPlan.id;
      subscription.plan = newPlan;
      subscription.billingInterval = newBillingInterval;
      subscription.creditBalance = Number(subscription.creditBalance || 0) + proration.credit;
      
      const updatedSubscription = await this.subscriptionRepository.save(subscription);
      
      // Audit log
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_DOWNGRADED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          oldPlan: oldPlanName,
          newPlan: newPlanName,
          credit: proration.credit,
          description: proration.description,
        },
        tenant_id: tenantId,
      });
      
      return {
        checkoutUrl: '', // No payment needed
        subscription: updatedSubscription,
      };
    }

    // For upgrades, check if we need payment after applying credits
    let finalAmount = proration.amount;
    
    // Apply existing credit balance to the upgrade amount
    if (proration.isUpgrade && existingCredit > 0) {
      this.logger.log(`Applying €${existingCredit} credit to upgrade amount of €${proration.amount}`);
      finalAmount = Math.max(0, proration.amount - existingCredit);
      
      // Update credit balance
      if (finalAmount === 0) {
        // All covered by credit, deduct what was used
        subscription.creditBalance = existingCredit - proration.amount;
      } else {
        // Credit partially covered, set to 0
        subscription.creditBalance = 0;
      }
      
      this.logger.log(`Final amount after credit: €${finalAmount}`);
    }
    
    // If no payment needed, update immediately
    if (finalAmount === 0) {
      this.logger.log('No payment needed after applying credits, updating subscription immediately');
      
      // Store the old plan name before updating
      const oldPlanName = subscription.plan.name;
      
      subscription.planId = newPlan.id;
      subscription.plan = newPlan;
      subscription.billingInterval = newBillingInterval;
      
      const updatedSubscription = await this.subscriptionRepository.save(subscription);
      
      // Audit log
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_UPGRADED_WITH_CREDIT',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          oldPlan: oldPlanName,
          newPlan: newPlanName,
          creditUsed: proration.amount,
          remainingCredit: subscription.creditBalance,
        },
        tenant_id: tenantId,
      });
      
      return {
        checkoutUrl: '',
        subscription: updatedSubscription,
      };
    }

    // Create a one-time payment for the prorated amount
    try {
      // First ensure we have a Mollie customer for this tenant
      const tenantRepo = this.subscriptionRepository.manager.getRepository('Tenant');
      const tenant = await tenantRepo.findOne({ 
        where: { id: tenantId },
        relations: ['users'] 
      });
      
      // Get the primary admin user's email for this tenant
      const userRepo = this.subscriptionRepository.manager.getRepository('User');
      const adminUser = await userRepo.findOne({
        where: { 
          tenant: { id: tenantId },
          role: 'garage_admin'
        },
        order: { created_at: 'ASC' }
      });
      
      const customerEmail = adminUser?.email || `tenant-${tenantId}@example.com`;
      
      const customer = await this.paymentsService.getOrCreateCustomer(tenantId, {
        email: customerEmail,
        name: tenant?.display_name || tenant?.name || `Tenant ${tenantId}`,
        metadata: { tenantId, action: 'subscription_change' },
      });

      // Update description to include credit info if applicable
      let paymentDescription = proration.description;
      if (existingCredit > 0 && finalAmount < proration.amount) {
        paymentDescription += ` (€${existingCredit.toFixed(2)} credit applied)`;
      }
      
      // Create payment for the final amount after credits
      const payment = await this.paymentsService.createCheckoutPayment({
        amount: finalAmount,
        currency: 'EUR',
        description: paymentDescription,
        customerId: customer.id,
        redirectUrl: returnUrl,
        webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
        metadata: {
          tenantId,
          subscriptionId,
          newPlanName,
          newBillingInterval,
          action: 'subscription_change',
          prorationDetails: {
            daysRemaining: proration.daysRemaining,
            totalDays: proration.totalDays,
            credit: proration.credit,
            originalAmount: proration.amount,
            creditApplied: proration.amount - finalAmount,
          },
        },
      });
      
      // Store the payment ID and update credit balance if credits were used
      subscription.metadata = {
        ...subscription.metadata,
        pendingChangePaymentId: payment.id,
        pendingNewPlanName: newPlanName,
        pendingNewBillingInterval: newBillingInterval,
        creditApplied: proration.amount - finalAmount,
      };
      
      // If we used credits for partial payment, update the balance
      if (existingCredit > 0 && finalAmount > 0) {
        subscription.creditBalance = 0;
      }
      
      await this.subscriptionRepository.save(subscription);

      // Audit log subscription change attempt
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_CHANGE_INITIATED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          currentPlan: subscription.plan.name,
          newPlan: newPlanName,
          amount: proration.amount,
          paymentId: payment.id,
          prorationDescription: proration.description,
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
      // Get tenant information for customer creation
      const tenantRepo = this.subscriptionRepository.manager.getRepository('Tenant');
      const tenant = await tenantRepo.findOne({ 
        where: { id: tenantId },
        relations: ['users'] 
      });
      
      // Get the primary admin user's email for this tenant
      const userRepo = this.subscriptionRepository.manager.getRepository('User');
      const adminUser = await userRepo.findOne({
        where: { 
          tenant: { id: tenantId },
          role: 'garage_admin'
        },
        order: { created_at: 'ASC' }
      });
      
      const customerEmail = adminUser?.email || `tenant-${tenantId}@example.com`;
      
      const customer = await this.paymentsService.getOrCreateCustomer(tenantId, {
        email: customerEmail,
        name: tenant?.display_name || tenant?.name || `Tenant ${tenantId}`,
        metadata: { tenantId, action: 'new_subscription' },
      });

      // Check if customer has valid mandate
      const hasMandate = await this.paymentsService.hasValidMandate(customer.id);
      
      if (!hasMandate || customer.isNew) {
        // Customer needs to set up mandate first with a first payment
        this.logger.log('Customer needs mandate setup, creating first payment');
        
        // Create first payment to establish mandate
        const payment = await this.paymentsService.createCheckoutPayment({
          amount,
          currency: 'EUR',
          description: `${plan.displayName} subscription - First payment`,
          customerId: customer.id,
          redirectUrl: dto.returnUrl,
          webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
          sequenceType: 'first', // This creates a mandate
          metadata: {
            tenantId,
            planName: dto.planName,
            billingInterval: dto.billingInterval,
            action: 'subscription_mandate_setup',
            subscriptionStart: true,
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
          mollieCustomerId: customer.id,
          metadata: {
            ...dto.metadata,
            pendingPaymentId: payment.id,
            awaitingMandateSetup: true,
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
            mandateSetup: true,
          },
          tenant_id: tenantId,
        });

        return {
          checkoutUrl: payment.checkoutUrl,
          subscription: savedSubscription,
        };
      } else {
        // Customer has mandate, create subscription directly
        this.logger.log('Customer has mandate, creating subscription directly');
        
        const mollieSubscription = await this.paymentsService.createSubscription({
          customerId: customer.id,
          amount,
          currency: 'EUR',
          interval: dto.billingInterval === BillingInterval.YEAR ? 'yearly' : 'monthly',
          description: `${plan.displayName} subscription`,
          metadata: {
            tenantId,
            planName: dto.planName,
            billingInterval: dto.billingInterval,
          },
        });

        // Create subscription record
        const now = new Date();
        const subscription = this.subscriptionRepository.create({
          tenantId,
          planId: plan.id,
          paymentMethodId: dto.paymentMethodId,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: dto.billingInterval || BillingInterval.MONTH,
          currentPeriodStart: now,
          currentPeriodEnd: mollieSubscription.nextPaymentDate,
          nextPaymentDate: mollieSubscription.nextPaymentDate,
          mollieCustomerId: customer.id,
          mollieSubscriptionId: mollieSubscription.id,
          metadata: {
            ...dto.metadata,
            mollieStatus: mollieSubscription.status,
          },
        });

        const savedSubscription = await this.subscriptionRepository.save(subscription);

        // Audit log
        await this.auditService.logAction({
          action: 'SUBSCRIPTION_CREATED_WITH_MOLLIE',
          resource_type: 'Subscription',
          resource_id: savedSubscription.id,
          details: {
            planName: dto.planName,
            billingInterval: dto.billingInterval,
            amount,
            mollieSubscriptionId: mollieSubscription.id,
          },
          tenant_id: tenantId,
        });

        // No checkout URL needed, redirect to success page
        return {
          checkoutUrl: dto.returnUrl + '?status=success',
          subscription: savedSubscription,
        };
      }
    } catch (error) {
      this.logger.error('Failed to create paid subscription', error);
      throw new BadRequestException(error.message || 'Failed to initiate subscription');
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

      // Check if this was a mandate setup payment
      if (metadata.action === 'subscription_mandate_setup') {
        // Now create the actual Mollie subscription
        const plan = subscription.plan;
        const amount = subscription.billingInterval === BillingInterval.YEAR 
          ? parseFloat(plan.priceYearly.toString()) 
          : parseFloat(plan.priceMonthly.toString());

        try {
          const mollieSubscription = await this.paymentsService.createSubscription({
            customerId: subscription.mollieCustomerId,
            amount,
            currency: 'EUR',
            interval: subscription.billingInterval === BillingInterval.YEAR ? 'yearly' : 'monthly',
            description: `${plan.displayName} - ${new Date().toISOString().slice(0, 10)}`,
            metadata: {
              tenantId,
              subscriptionId: subscription.id,
              planName: plan.name,
            },
          });

          // Update subscription with Mollie details
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.currentPeriodStart = new Date();
          subscription.currentPeriodEnd = mollieSubscription.nextPaymentDate;
          subscription.nextPaymentDate = mollieSubscription.nextPaymentDate;
          subscription.mollieSubscriptionId = mollieSubscription.id;
          subscription.metadata = {
            ...subscription.metadata,
            activatedAt: new Date().toISOString(),
            activationPaymentId: paymentId,
            mollieStatus: mollieSubscription.status,
          };
          delete subscription.metadata.pendingPaymentId;
          delete subscription.metadata.awaitingMandateSetup;

          const updatedSubscription = await this.subscriptionRepository.save(subscription);

          // Audit log
          await this.auditService.logAction({
            action: 'SUBSCRIPTION_ACTIVATED_WITH_MOLLIE',
            resource_type: 'Subscription',
            resource_id: subscription.id,
            details: {
              plan: subscription.plan.name,
              paymentId,
              mollieSubscriptionId: mollieSubscription.id,
              amount: payment.amount,
            },
            tenant_id: tenantId,
          });

          this.logger.log(`Subscription ${subscription.id} activated with Mollie subscription ${mollieSubscription.id}`);
          return updatedSubscription;
        } catch (error) {
          this.logger.error('Failed to create Mollie subscription after mandate setup', error);
          // Update subscription status to reflect the error
          subscription.status = SubscriptionStatus.INCOMPLETE;
          subscription.metadata.error = error.message;
          await this.subscriptionRepository.save(subscription);
          throw error;
        }
      } else {
        // Legacy path for one-time payment activation (shouldn't happen with new flow)
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
        subscription.metadata = {
          ...subscription.metadata,
          activatedAt: now.toISOString(),
          activationPaymentId: paymentId,
          legacyActivation: true,
        };
        delete subscription.metadata.pendingPaymentId;

        const updatedSubscription = await this.subscriptionRepository.save(subscription);

        await this.auditService.logAction({
          action: 'SUBSCRIPTION_ACTIVATED_LEGACY',
          resource_type: 'Subscription',
          resource_id: subscription.id,
          details: {
            plan: subscription.plan.name,
            paymentId,
            amount: payment.amount,
          },
          tenant_id: tenantId,
        });

        return updatedSubscription;
      }
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
      
      // Clear pending payment metadata
      delete subscription.metadata.pendingChangePaymentId;
      delete subscription.metadata.pendingNewPlanName;
      delete subscription.metadata.pendingNewBillingInterval;

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

  /**
   * Process a recurring subscription payment
   * Called from webhook when a subscription payment is successful
   */
  async processRecurringPayment(
    subscriptionId: string,
    paymentId: string,
    amount: number,
  ): Promise<void> {
    this.logger.log(`Processing recurring payment for subscription ${subscriptionId}`);

    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
        relations: ['plan'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Update subscription period
      const now = new Date();
      subscription.currentPeriodStart = now;
      
      if (subscription.billingInterval === BillingInterval.YEAR) {
        subscription.currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      } else {
        subscription.currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      }

      // Apply any credits
      if (subscription.creditBalance && subscription.creditBalance > 0) {
        const creditUsed = Math.min(subscription.creditBalance, amount);
        subscription.creditBalance = subscription.creditBalance - creditUsed;
        this.logger.log(`Applied ${creditUsed} credit to payment`);
      }

      // Update next payment date
      subscription.nextPaymentDate = subscription.currentPeriodEnd;
      subscription.status = SubscriptionStatus.ACTIVE;

      await this.subscriptionRepository.save(subscription);

      // Audit log
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_PAYMENT_PROCESSED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          paymentId,
          amount,
          newPeriodEnd: subscription.currentPeriodEnd,
        },
        tenant_id: subscription.tenantId,
      });

      this.logger.log(`Subscription ${subscriptionId} renewed until ${subscription.currentPeriodEnd}`);
    } catch (error) {
      this.logger.error('Failed to process recurring payment', error);
      throw error;
    }
  }

  /**
   * Handle a failed subscription payment
   * Called from webhook when a subscription payment fails
   */
  async handleFailedPayment(
    subscriptionId: string,
    paymentId: string,
  ): Promise<void> {
    this.logger.log(`Handling failed payment for subscription ${subscriptionId}`);

    try {
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      // Mark subscription as past due
      subscription.status = SubscriptionStatus.PAST_DUE;

      await this.subscriptionRepository.save(subscription);

      // Audit log
      await this.auditService.logAction({
        action: 'SUBSCRIPTION_PAYMENT_FAILED',
        resource_type: 'Subscription',
        resource_id: subscriptionId,
        details: {
          paymentId,
          previousStatus: subscription.status,
        },
        tenant_id: subscription.tenantId,
      });

      // Send notification email to tenant
      // In production, integrate with email service to notify about failed payment

      this.logger.log(`Subscription ${subscriptionId} marked as past due`);
    } catch (error) {
      this.logger.error('Failed to handle failed payment', error);
      throw error;
    }
  }

  async payOverdueSubscription(tenantId: string, subscriptionId: string): Promise<{ checkoutUrl: string }> {
    this.logger.log(`Creating overdue payment for subscription ${subscriptionId}`);
    
    try {
      // Get the subscription
      const subscription = await this.subscriptionRepository.findOne({
        where: { id: subscriptionId, tenantId },
        relations: ['plan'],
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      if (subscription.status !== SubscriptionStatus.PAST_DUE) {
        throw new BadRequestException('Subscription is not overdue');
      }

      // Calculate the amount to pay (current period price minus any credits)
      const planPrice = subscription.billingInterval === BillingInterval.MONTH 
        ? subscription.plan.priceMonthly 
        : subscription.plan.priceYearly;
      
      const amountToPay = Math.max(0, planPrice - (subscription.creditBalance || 0));

      // Create payment with Mollie
      const payment = await this.paymentsService.createCheckoutPayment({
        amount: amountToPay,
        currency: 'EUR',
        description: `Achterstallige betaling - ${subscription.plan.displayName}`,
        redirectUrl: `${process.env.FRONTEND_URL}/garage-admin/payment-return`,
        webhookUrl: `${process.env.API_URL}/payments/webhook`,
        metadata: {
          type: 'overdue_payment',
          subscriptionId: subscription.id,
          tenantId: subscription.tenantId,
        },
      });

      // Store payment ID in subscription metadata
      subscription.metadata = {
        ...subscription.metadata,
        pendingOverduePaymentId: payment.id,
      };
      await this.subscriptionRepository.save(subscription);

      this.logger.log(`Created overdue payment ${payment.id} for subscription ${subscriptionId}`);
      
      return { checkoutUrl: payment.checkoutUrl };
    } catch (error) {
      this.logger.error('Failed to create overdue payment', error);
      throw error;
    }
  }

  /**
   * Get the number of trial days from configuration
   * @returns Number of days for trial period
   */
  private getTrialDays(): number {
    return this.configService.get<number>('SUBSCRIPTION_TRIAL_DAYS', 30);
  }
}