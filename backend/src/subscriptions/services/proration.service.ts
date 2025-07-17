import { Injectable } from '@nestjs/common';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class ProrationService {
  /**
   * Calculate proration amount for subscription upgrade/downgrade
   * @param currentSubscription Current active subscription
   * @param newPlan New subscription plan
   * @param immediate Whether to apply immediately or at period end
   * @returns Proration amount in cents (positive = charge, negative = credit)
   */
  calculateProration(
    currentSubscription: Subscription,
    newPlan: SubscriptionPlan,
    immediate: boolean = true,
  ): number {
    if (!immediate) {
      return 0; // No proration for end-of-period changes
    }

    const currentPlan = currentSubscription.plan;
    if (!currentPlan) {
      return newPlan.price_cents; // Full price if no current plan
    }

    // Calculate days remaining in current period
    const now = new Date();
    const periodEnd = new Date(currentSubscription.current_period_end);
    const periodStart = new Date(currentSubscription.current_period_start);

    const totalDaysInPeriod = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const daysRemaining = Math.ceil(
      (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysRemaining <= 0) {
      return newPlan.price_cents; // Full price if period ended
    }

    // Calculate unused amount from current plan
    const dailyRateCurrent = currentPlan.price_cents / totalDaysInPeriod;
    const unusedAmountCurrent = Math.round(dailyRateCurrent * daysRemaining);

    // Calculate new plan cost for remaining days
    const dailyRateNew = newPlan.price_cents / totalDaysInPeriod;
    const newPlanCostRemaining = Math.round(dailyRateNew * daysRemaining);

    // Proration = new plan cost - unused current plan credit
    return newPlanCostRemaining - unusedAmountCurrent;
  }

  /**
   * Calculate the next billing date
   * @param immediate Whether change is immediate or at period end
   * @param currentPeriodEnd Current subscription period end
   * @returns Next billing date
   */
  getNextBillingDate(immediate: boolean, currentPeriodEnd: Date): Date {
    if (!immediate) {
      return currentPeriodEnd;
    }

    // For immediate changes, next billing is one month from now
    const nextBilling = new Date();
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    return nextBilling;
  }

  /**
   * Format proration details for display
   * @param prorationAmount Proration amount in cents
   * @returns Formatted proration details
   */
  formatProrationDetails(prorationAmount: number): {
    description: string;
    amount: number;
    isCredit: boolean;
  } {
    const isCredit = prorationAmount < 0;
    const absAmount = Math.abs(prorationAmount);

    return {
      description: isCredit
        ? `Credit for unused time on current plan`
        : `Prorated charge for plan upgrade`,
      amount: absAmount,
      isCredit,
    };
  }
}
