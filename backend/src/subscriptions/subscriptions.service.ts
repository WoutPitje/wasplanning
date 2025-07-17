import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { LimitsService, LimitType } from './services/limits.service';
import { UsageService } from './services/usage.service';
import { BillingService } from './services/billing.service';
import { ProrationService } from './services/proration.service';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { UsageResponseDto, UsageItemDto } from './dto/usage-response.dto';
import { UpgradeSubscriptionResponseDto } from './dto/upgrade-subscription.dto';
import { InvoicesResponseDto, InvoiceDto } from './dto/invoice-response.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    private limitsService: LimitsService,
    private usageService: UsageService,
    private billingService: BillingService,
    private prorationService: ProrationService,
  ) {}

  async getCurrentSubscription(
    tenantId: string,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.ensureSubscriptionExists(tenantId);

    if (!subscription.plan) {
      throw new Error('Subscription plan not loaded');
    }

    const usage = await this.limitsService.getLimitsAndUsage(tenantId);
    const daysRemaining = this.calculateDaysRemaining(
      subscription.current_period_end,
    );

    return {
      id: subscription.id,
      tenant_id: subscription.tenant_id,
      plan_name: subscription.plan.name,
      plan_display_name: subscription.plan.display_name,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      days_remaining: daysRemaining,
      price_cents: subscription.plan.price_cents,
      price_euros: subscription.plan.price_cents / 100,
      usage,
      features: subscription.plan.features,
      stripe_customer_id: subscription.stripe_customer_id,
      stripe_subscription_id: subscription.stripe_subscription_id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at,
      canceled_at: subscription.canceled_at,
    };
  }

  async getAvailablePlans(tenantId: string): Promise<PlanResponseDto[]> {
    const plans = await this.subscriptionPlanRepository.find({
      order: { price_cents: 'ASC' },
    });

    const currentSubscription = await this.subscriptionRepository.findOne({
      where: {
        tenant_id: tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      display_name: plan.display_name,
      price_cents: plan.price_cents,
      price_euros: plan.price_cents / 100,
      price_display: `€${(plan.price_cents / 100).toFixed(2).replace('.', ',')}/maand`,
      max_cars_per_month: plan.max_cars_per_month,
      max_active_users: plan.max_active_users,
      max_locations: plan.max_locations,
      features: plan.features,
      is_current: currentSubscription?.plan?.id === plan.id,
      is_recommended: plan.name === 'standard', // Standard plan is recommended
    }));
  }

  async getDetailedUsage(tenantId: string): Promise<UsageResponseDto> {
    const subscription = await this.ensureSubscriptionExists(tenantId);

    if (!subscription.plan) {
      throw new Error('Subscription plan not loaded');
    }

    const usage = await this.limitsService.getLimitsAndUsage(tenantId);
    const daysRemaining = this.calculateDaysRemaining(
      subscription.current_period_end,
    );

    const carsWashedItem: UsageItemDto = {
      current: usage.cars_washed.current,
      limit: usage.cars_washed.limit,
      remaining: usage.cars_washed.limit
        ? usage.cars_washed.limit - usage.cars_washed.current
        : null,
      percentage: usage.cars_washed.percentage,
      is_approaching_limit: usage.cars_washed.percentage >= 80,
      is_at_limit: usage.cars_washed.limit
        ? usage.cars_washed.current >= usage.cars_washed.limit
        : false,
    };

    const activeUsersItem: UsageItemDto = {
      current: usage.active_users.current,
      limit: usage.active_users.limit,
      remaining: usage.active_users.limit
        ? usage.active_users.limit - usage.active_users.current
        : null,
      percentage: usage.active_users.percentage,
      is_approaching_limit: usage.active_users.percentage >= 80,
      is_at_limit: usage.active_users.limit
        ? usage.active_users.current >= usage.active_users.limit
        : false,
    };

    const locationsItem: UsageItemDto = {
      current: usage.locations.current,
      limit: usage.locations.limit,
      remaining: usage.locations.limit
        ? usage.locations.limit - usage.locations.current
        : null,
      percentage: usage.locations.percentage,
      is_approaching_limit: usage.locations.percentage >= 80,
      is_at_limit: usage.locations.limit
        ? usage.locations.current >= usage.locations.limit
        : false,
    };

    const atLimit: string[] = [];
    const approachingLimit: string[] = [];

    if (carsWashedItem.is_at_limit) atLimit.push('cars_washed');
    else if (carsWashedItem.is_approaching_limit)
      approachingLimit.push('cars_washed');

    if (activeUsersItem.is_at_limit) atLimit.push('active_users');
    else if (activeUsersItem.is_approaching_limit)
      approachingLimit.push('active_users');

    if (locationsItem.is_at_limit) atLimit.push('locations');
    else if (locationsItem.is_approaching_limit)
      approachingLimit.push('locations');

    return {
      period_start: subscription.current_period_start,
      period_end: subscription.current_period_end,
      days_remaining: daysRemaining,
      cars_washed: carsWashedItem,
      active_users: activeUsersItem,
      locations: locationsItem,
      summary: {
        at_limit: atLimit,
        approaching_limit: approachingLimit,
      },
    };
  }

  async getCurrentLimits(tenantId: string): Promise<{
    limits: any;
    remaining_quota: any;
    can_perform: any;
  }> {
    const subscription = await this.ensureSubscriptionExists(tenantId);

    if (!subscription.plan) {
      throw new Error('Subscription plan not loaded');
    }

    const usage = await this.limitsService.getLimitsAndUsage(tenantId);

    return {
      limits: {
        cars_per_month: subscription.plan.max_cars_per_month,
        active_users: subscription.plan.max_active_users,
        locations: subscription.plan.max_locations,
      },
      remaining_quota: {
        cars_per_month: subscription.plan.max_cars_per_month
          ? subscription.plan.max_cars_per_month - usage.cars_washed.current
          : null,
        active_users: subscription.plan.max_active_users
          ? subscription.plan.max_active_users - usage.active_users.current
          : null,
        locations: subscription.plan.max_locations
          ? subscription.plan.max_locations - usage.locations.current
          : null,
      },
      can_perform: {
        wash_car: await this.limitsService.canWashCar(tenantId),
        create_user: await this.limitsService.canCreateUser(tenantId),
        create_location: await this.limitsService.canCreateLocation(tenantId),
      },
    };
  }

  private calculateDaysRemaining(endDate: Date): number {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Ensure a subscription exists for the tenant, creating a free one if needed
   */
  private async ensureSubscriptionExists(
    tenantId: string,
  ): Promise<Subscription> {
    // Check for existing active/incomplete subscription
    let subscription = await this.subscriptionRepository.findOne({
      where: {
        tenant_id: tenantId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.INCOMPLETE]),
      },
      relations: ['plan'],
    });

    // If no active subscription exists
    if (!subscription) {
      const freePlan = await this.subscriptionPlanRepository.findOne({
        where: { name: 'free' },
      });

      if (!freePlan) {
        throw new Error(
          'Free plan not found in database. Please run seed data.',
        );
      }

      // Check if there's an existing canceled subscription we can reactivate
      const existingSubscription = await this.subscriptionRepository.findOne({
        where: { tenant_id: tenantId },
      });

      if (existingSubscription) {
        // Update the existing subscription to free plan
        existingSubscription.plan = freePlan;
        existingSubscription.status = SubscriptionStatus.ACTIVE;
        existingSubscription.current_period_start = new Date();
        existingSubscription.current_period_end = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        );
        existingSubscription.cancel_at_period_end = false;
        existingSubscription.cancel_at = null;
        existingSubscription.canceled_at = null;

        subscription =
          await this.subscriptionRepository.save(existingSubscription);
      } else {
        // Create a new FREE subscription
        subscription = await this.subscriptionRepository.save({
          tenant_id: tenantId,
          plan: freePlan,
          status: SubscriptionStatus.ACTIVE,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });
      }

      // Reload with plan relation
      subscription = await this.subscriptionRepository.findOne({
        where: { id: subscription.id },
        relations: ['plan'],
      });
    }

    return subscription;
  }

  async upgradeSubscription(
    tenantId: string,
    planId: string,
    paymentMethodId?: string,
    immediate: boolean = true,
  ): Promise<UpgradeSubscriptionResponseDto> {
    // Get current subscription with plan
    const currentSubscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
      relations: ['plan'],
    });

    if (!currentSubscription) {
      throw new NotFoundException('No subscription found');
    }

    // Get new plan
    const newPlan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
    });

    if (!newPlan) {
      throw new NotFoundException('Invalid plan ID');
    }

    // Create or update subscription in Stripe
    const result = await this.billingService.createSubscription(
      tenantId,
      planId,
      paymentMethodId,
      immediate,
    );

    // Get next billing date
    const nextBillingDate = this.prorationService.getNextBillingDate(
      immediate,
      result.subscription.current_period_end,
    );

    return {
      subscription_id: result.subscription.id,
      stripe_subscription_id: result.stripeSubscription.id,
      status: result.subscription.status,
      client_secret: result.clientSecret,
      requires_action: result.requiresAction,
      amount_charged: result.amountCharged,
      proration_amount: result.prorationAmount,
      next_billing_date: nextBillingDate,
    };
  }

  async cancelSubscription(
    tenantId: string,
  ): Promise<{ message: string; cancel_at: Date }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        tenant_id: tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    // For free subscriptions, we can't cancel
    if (
      !subscription.stripe_subscription_id ||
      subscription.plan?.price_cents === 0
    ) {
      throw new BadRequestException('Cannot cancel free subscription');
    }

    // Find the free plan
    const freePlan = await this.subscriptionPlanRepository.findOne({
      where: { name: 'free' },
    });

    if (!freePlan) {
      throw new Error('Free plan not found in database');
    }

    // Use the upgrade/downgrade logic to schedule a downgrade to free
    // This ensures consistent behavior and automatic free plan creation
    await this.upgradeSubscription(
      tenantId,
      freePlan.id,
      undefined, // No payment method needed for free
      false, // Schedule for end of period
    );

    return {
      message:
        'Subscription will be downgraded to free plan at the end of the billing period',
      cancel_at: subscription.current_period_end,
    };
  }

  async reactivateSubscription(tenantId: string): Promise<{ message: string }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        tenant_id: tenantId,
        status: SubscriptionStatus.ACTIVE,
        cancel_at_period_end: true,
      },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(
        'No subscription scheduled for cancellation found',
      );
    }

    if (!subscription.stripe_subscription_id) {
      throw new BadRequestException(
        'Cannot reactivate non-Stripe subscription',
      );
    }

    // Reactivate the subscription in Stripe
    await this.billingService.reactivateSubscription(
      subscription.stripe_subscription_id,
    );

    // Update our database
    subscription.cancel_at_period_end = false;
    subscription.cancel_at = null;
    subscription.canceled_at = null;
    await this.subscriptionRepository.save(subscription);

    return {
      message: 'Subscription reactivated successfully',
    };
  }

  async getInvoices(
    tenantId: string,
    limit?: number,
    starting_after?: string,
  ): Promise<InvoicesResponseDto> {
    // Ensure subscription exists and get customer ID
    const subscription = await this.ensureSubscriptionExists(tenantId);

    if (!subscription.stripe_customer_id) {
      // No Stripe customer, return empty list
      return {
        invoices: [],
        has_more: false,
        total_count: 0,
      };
    }

    // Get invoices from billing service
    const invoiceData = await this.billingService.getInvoices(
      subscription.stripe_customer_id,
      limit,
      starting_after,
    );

    return invoiceData;
  }
}
