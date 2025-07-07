import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Subscription, BillingInterval } from '../entities/subscription.entity';

export interface ProrationResult {
  amount: number;
  credit: number;
  daysRemaining: number;
  totalDays: number;
  description: string;
  isUpgrade: boolean;
  existingCredit?: number;
  finalAmount?: number;
}

@Injectable()
export class ProrationService {
  private readonly logger = new Logger(ProrationService.name);

  /**
   * Calculate proration for subscription plan change
   */
  calculateProration(
    currentSubscription: Subscription,
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    newBillingInterval?: BillingInterval,
  ): ProrationResult {
    const now = new Date();
    const periodEnd = new Date(currentSubscription.currentPeriodEnd);
    const periodStart = new Date(currentSubscription.currentPeriodStart);

    // Calculate days remaining in current period
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    // Get current and new prices
    const billingInterval = newBillingInterval || currentSubscription.billingInterval;
    const currentPrice = this.getPlanPrice(currentPlan, currentSubscription.billingInterval);
    const newPrice = this.getPlanPrice(newPlan, billingInterval);

    // Calculate daily rates
    const currentDailyRate = currentPrice / totalDays;
    const newDailyRate = newPrice / totalDays;

    // Calculate unused value from current plan
    const unusedValue = currentDailyRate * daysRemaining;

    // Calculate cost for remaining period on new plan
    const newPlanCost = newDailyRate * daysRemaining;

    // Determine if this is an upgrade or downgrade by comparing monthly prices
    const currentMonthlyPrice = this.getPlanPrice(currentPlan, BillingInterval.MONTH);
    const newMonthlyPrice = this.getPlanPrice(newPlan, BillingInterval.MONTH);
    const isUpgrade = newMonthlyPrice > currentMonthlyPrice;

    // Calculate amount to charge or credit
    let amount = 0;
    let credit = 0;

    if (isUpgrade) {
      // For upgrades, charge the difference
      amount = Math.max(0, newPlanCost - unusedValue);
    } else {
      // For downgrades, give credit
      credit = Math.max(0, unusedValue - newPlanCost);
    }

    // Round to 2 decimal places
    amount = Math.round(amount * 100) / 100;
    credit = Math.round(credit * 100) / 100;

    const description = this.generateDescription(
      currentPlan,
      newPlan,
      daysRemaining,
      amount,
      credit,
      isUpgrade,
    );

    this.logger.log(`Proration calculated: ${description}`);
    this.logger.log(`Days remaining: ${daysRemaining}/${totalDays}, Amount: €${amount}, Credit: €${credit}`);

    return {
      amount,
      credit,
      daysRemaining,
      totalDays,
      description,
      isUpgrade,
    };
  }

  /**
   * Calculate refund amount for subscription cancellation
   */
  calculateCancellationRefund(
    subscription: Subscription,
    plan: SubscriptionPlan,
    immediatelyCanceled: boolean,
  ): number {
    if (!immediatelyCanceled || subscription.cancelAtPeriodEnd) {
      // No refund if canceling at period end
      return 0;
    }

    const now = new Date();
    const periodEnd = new Date(subscription.currentPeriodEnd);
    const periodStart = new Date(subscription.currentPeriodStart);

    // Calculate unused days
    const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining === 0) {
      return 0;
    }

    // Get the price paid for current period
    const price = this.getPlanPrice(plan, subscription.billingInterval);
    const dailyRate = price / totalDays;
    const refund = dailyRate * daysRemaining;

    return Math.round(refund * 100) / 100;
  }

  /**
   * Get plan price based on billing interval
   */
  private getPlanPrice(plan: SubscriptionPlan, billingInterval: BillingInterval): number {
    const price = billingInterval === BillingInterval.YEAR
      ? plan.priceYearly
      : plan.priceMonthly;
    
    return typeof price === 'string' ? parseFloat(price) : price;
  }

  /**
   * Generate human-readable description of proration
   */
  private generateDescription(
    currentPlan: SubscriptionPlan,
    newPlan: SubscriptionPlan,
    daysRemaining: number,
    amount: number,
    credit: number,
    isUpgrade: boolean,
  ): string {
    const action = isUpgrade ? 'Upgrade' : 'Downgrade';
    const fromTo = `${currentPlan.displayName} to ${newPlan.displayName}`;
    
    if (amount > 0) {
      return `${action} from ${fromTo} - €${amount.toFixed(2)} for ${daysRemaining} days`;
    } else if (credit > 0) {
      return `${action} from ${fromTo} - €${credit.toFixed(2)} credit for ${daysRemaining} days`;
    } else {
      return `${action} from ${fromTo} - No charge`;
    }
  }

  /**
   * Calculate the first payment amount for a new subscription
   * (prorated to align with monthly billing cycle)
   */
  calculateFirstPayment(
    plan: SubscriptionPlan,
    billingInterval: BillingInterval,
    startDate: Date = new Date(),
  ): { amount: number; periodEnd: Date; description: string } {
    const now = startDate;
    let periodEnd: Date;
    let amount: number;
    let description: string;

    if (billingInterval === BillingInterval.YEAR) {
      // For yearly billing, charge full year
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      amount = this.getPlanPrice(plan, billingInterval);
      description = `${plan.displayName} - Yearly subscription`;
    } else {
      // For monthly billing, prorate to end of month
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInMonth = endOfMonth.getDate();
      const currentDay = now.getDate();
      const daysRemaining = daysInMonth - currentDay + 1;

      periodEnd = endOfMonth;
      const monthlyPrice = this.getPlanPrice(plan, billingInterval);
      amount = (monthlyPrice / daysInMonth) * daysRemaining;
      amount = Math.round(amount * 100) / 100;
      
      description = `${plan.displayName} - First month (${daysRemaining} days)`;
    }

    return { amount, periodEnd, description };
  }
}