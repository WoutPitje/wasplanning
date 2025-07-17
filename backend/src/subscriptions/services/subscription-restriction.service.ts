import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';

@Injectable()
export class SubscriptionRestrictionService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Check if a tenant's subscription is within grace period
   */
  async isWithinGracePeriod(tenantId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      return false;
    }

    // Active subscriptions are always allowed
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return true;
    }

    // Check if past grace period
    if (subscription.grace_period_end) {
      const now = new Date();
      return subscription.grace_period_end > now;
    }

    return false;
  }

  /**
   * Check if a tenant should have read-only access
   */
  async isReadOnly(tenantId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      return true; // No subscription = read-only
    }

    // Active subscriptions have full access
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return false;
    }

    // Canceled subscriptions are read-only
    if (subscription.status === SubscriptionStatus.CANCELED) {
      return true;
    }

    // Past due subscriptions check grace period
    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      const withinGracePeriod = await this.isWithinGracePeriod(tenantId);
      // If past grace period, restrict to read-only
      return !withinGracePeriod;
    }

    // Default to read-only for safety
    return true;
  }

  /**
   * Get subscription restriction details
   */
  async getRestrictionDetails(tenantId: string): Promise<{
    isRestricted: boolean;
    reason?: string;
    gracePeriodEnd?: Date;
    daysRemaining?: number;
  }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      return {
        isRestricted: true,
        reason: 'No active subscription found',
      };
    }

    if (subscription.status === SubscriptionStatus.ACTIVE) {
      return {
        isRestricted: false,
      };
    }

    if (subscription.status === SubscriptionStatus.CANCELED) {
      return {
        isRestricted: true,
        reason: 'Subscription has been canceled',
      };
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      const now = new Date();

      if (
        subscription.grace_period_end &&
        subscription.grace_period_end > now
      ) {
        const daysRemaining = Math.ceil(
          (subscription.grace_period_end.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        );

        return {
          isRestricted: false,
          reason: 'Payment failed but within grace period',
          gracePeriodEnd: subscription.grace_period_end,
          daysRemaining,
        };
      }

      return {
        isRestricted: true,
        reason: 'Payment failed and grace period has expired',
      };
    }

    return {
      isRestricted: true,
      reason: 'Unknown subscription status',
    };
  }
}
