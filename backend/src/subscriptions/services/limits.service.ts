import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UsageService } from './usage.service';
import { UsageType } from '../entities/usage-record.entity';
import { User } from '../../auth/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

export enum LimitType {
  CARS_WASHED = 'cars_washed',
  ACTIVE_USERS = 'active_users',
  LOCATIONS = 'locations',
}

@Injectable()
export class LimitsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private usageService: UsageService,
  ) {}

  /**
   * Check if washing another car is allowed
   */
  async canWashCar(tenantId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription || !subscription.plan) {
      return false;
    }

    const limit = subscription.plan.max_cars_per_month;
    if (limit === null) {
      return true; // Unlimited
    }

    const currentUsage = await this.usageService.getMonthlyUsage(
      tenantId,
      UsageType.CARS_WASHED,
    );

    return currentUsage < limit;
  }

  /**
   * Check if creating another user is allowed
   */
  async canCreateUser(tenantId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription || !subscription.plan) {
      return false;
    }

    const limit = subscription.plan.max_active_users;
    if (limit === null) {
      return true; // Unlimited
    }

    // Count actual active users in the tenant
    const activeUserCount = await this.countActiveUsers(tenantId);

    return activeUserCount < limit;
  }

  /**
   * Check if creating another location is allowed
   */
  async canCreateLocation(tenantId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription || !subscription.plan) {
      return false;
    }

    const limit = subscription.plan.max_locations;
    if (limit === null) {
      return true; // Unlimited
    }

    const locationCount = await this.countActiveLocations(tenantId);
    return locationCount < limit;
  }

  /**
   * Get usage percentage for a specific limit type
   */
  async getUsagePercentage(tenantId: string, type: LimitType): Promise<number> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription || !subscription.plan) {
      return 0;
    }

    let limit: number | null;
    let currentUsage: number;

    switch (type) {
      case LimitType.CARS_WASHED:
        limit = subscription.plan.max_cars_per_month;
        currentUsage = await this.usageService.getMonthlyUsage(
          tenantId,
          UsageType.CARS_WASHED,
        );
        break;
      case LimitType.ACTIVE_USERS:
        limit = subscription.plan.max_active_users;
        currentUsage = await this.countActiveUsers(tenantId);
        break;
      case LimitType.LOCATIONS:
        limit = subscription.plan.max_locations;
        currentUsage = await this.countActiveLocations(tenantId);
        break;
      default:
        return 0;
    }

    if (limit === null) {
      return 0; // Unlimited = 0% usage
    }

    return Math.round((currentUsage / limit) * 100);
  }

  /**
   * Check if usage is approaching limit (80% threshold)
   */
  async isApproachingLimit(
    tenantId: string,
    type: LimitType,
  ): Promise<boolean> {
    const percentage = await this.getUsagePercentage(tenantId, type);
    return percentage >= 80;
  }

  /**
   * Get current limits and usage for a tenant
   */
  async getLimitsAndUsage(tenantId: string): Promise<{
    cars_washed: { current: number; limit: number | null; percentage: number };
    active_users: { current: number; limit: number | null; percentage: number };
    locations: { current: number; limit: number | null; percentage: number };
  }> {
    const subscription = await this.getActiveSubscription(tenantId);
    if (!subscription || !subscription.plan) {
      throw new Error('No active subscription found');
    }

    const carsUsage = await this.usageService.getMonthlyUsage(
      tenantId,
      UsageType.CARS_WASHED,
    );
    const usersUsage = await this.countActiveUsers(tenantId);

    return {
      cars_washed: {
        current: carsUsage,
        limit: subscription.plan.max_cars_per_month,
        percentage: await this.getUsagePercentage(
          tenantId,
          LimitType.CARS_WASHED,
        ),
      },
      active_users: {
        current: usersUsage,
        limit: subscription.plan.max_active_users,
        percentage: await this.getUsagePercentage(
          tenantId,
          LimitType.ACTIVE_USERS,
        ),
      },
      locations: {
        current: await this.countActiveLocations(tenantId),
        limit: subscription.plan.max_locations,
        percentage: await this.getUsagePercentage(
          tenantId,
          LimitType.LOCATIONS,
        ),
      },
    };
  }

  /**
   * Get active subscription with plan details
   */
  private async getActiveSubscription(
    tenantId: string,
  ): Promise<Subscription | null> {
    // First try to find an active or incomplete subscription
    let subscription = await this.subscriptionRepository.findOne({
      where: {
        tenant_id: tenantId,
        status: In([SubscriptionStatus.ACTIVE, SubscriptionStatus.INCOMPLETE]),
      },
      relations: ['plan'],
    });

    // If no subscription exists, create a FREE subscription
    if (!subscription) {
      const freePlan = await this.subscriptionPlanRepository.findOne({
        where: { name: 'free' },
      });

      if (!freePlan) {
        return null; // Let the caller handle this
      }

      // Create a new FREE subscription
      subscription = await this.subscriptionRepository.save({
        tenant_id: tenantId,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
    }

    return subscription;
  }

  /**
   * Count active users in a tenant
   */
  private async countActiveUsers(tenantId: string): Promise<number> {
    return this.userRepository.count({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });
  }

  /**
   * Count active locations for a tenant
   */
  private async countActiveLocations(tenantId: string): Promise<number> {
    return this.locationRepository.count({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });
  }
}
