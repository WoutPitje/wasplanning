import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UsageService } from './usage.service';
import { MetricType } from '../entities/usage-record.entity';

export interface LimitCheck {
  allowed: boolean;
  limit?: number;
  current: number;
  percentage: number;
  feature?: string;
}

@Injectable()
export class LimitsService {
  private readonly logger = new Logger(LimitsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    private usageService: UsageService,
  ) {}

  async checkLimit(
    subscriptionId: string,
    metricType: MetricType,
  ): Promise<LimitCheck> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    const plan = subscription.plan;
    const currentUsage = await this.usageService.getCurrentPeriodUsage(subscriptionId);
    const current = currentUsage[metricType] || 0;

    let limit: number | undefined;
    let allowed = true;

    switch (metricType) {
      case MetricType.CARS_WASHED:
        limit = plan.maxCarsPerMonth;
        break;
      case MetricType.ACTIVE_USERS:
        limit = plan.maxUsers;
        break;
      case MetricType.ACTIVE_LOCATIONS:
        limit = plan.maxLocations;
        break;
    }

    if (limit !== null && limit !== undefined) {
      allowed = current < limit;
    }

    const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;

    return {
      allowed,
      limit,
      current,
      percentage,
    };
  }

  async checkFeature(
    subscriptionId: string,
    featureName: string,
  ): Promise<LimitCheck> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    const hasFeature = subscription.plan.features[featureName] === true;

    return {
      allowed: hasFeature,
      current: hasFeature ? 1 : 0,
      percentage: hasFeature ? 100 : 0,
      feature: featureName,
    };
  }

  async getAllLimits(subscriptionId: string): Promise<{
    cars: LimitCheck;
    users: LimitCheck;
    locations: LimitCheck;
    features: Record<string, boolean>;
  }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    const [cars, users, locations] = await Promise.all([
      this.checkLimit(subscriptionId, MetricType.CARS_WASHED),
      this.checkLimit(subscriptionId, MetricType.ACTIVE_USERS),
      this.checkLimit(subscriptionId, MetricType.ACTIVE_LOCATIONS),
    ]);

    return {
      cars,
      users,
      locations,
      features: subscription.plan.features,
    };
  }

  async canCreateWashTask(subscriptionId: string): Promise<boolean> {
    const check = await this.checkLimit(subscriptionId, MetricType.CARS_WASHED);
    return check.allowed;
  }

  async canAddUser(subscriptionId: string): Promise<boolean> {
    const check = await this.checkLimit(subscriptionId, MetricType.ACTIVE_USERS);
    return check.allowed;
  }

  async canAddLocation(subscriptionId: string): Promise<boolean> {
    const check = await this.checkLimit(subscriptionId, MetricType.ACTIVE_LOCATIONS);
    return check.allowed;
  }

  async hasFeature(subscriptionId: string, featureName: string): Promise<boolean> {
    const check = await this.checkFeature(subscriptionId, featureName);
    return check.allowed;
  }

  async getLimitWarnings(subscriptionId: string): Promise<{
    warning: boolean;
    critical: boolean;
    messages: string[];
  }> {
    const limits = await this.getAllLimits(subscriptionId);
    const messages: string[] = [];
    let warning = false;
    let critical = false;

    // Check for 80% warning threshold
    if (limits.cars.limit && limits.cars.percentage >= 80) {
      warning = true;
      if (limits.cars.percentage >= 95) {
        critical = true;
        messages.push(`Critical: Car wash limit almost reached (${limits.cars.current}/${limits.cars.limit})`);
      } else {
        messages.push(`Warning: Car wash limit at ${Math.round(limits.cars.percentage)}% (${limits.cars.current}/${limits.cars.limit})`);
      }
    }

    if (limits.users.limit && limits.users.percentage >= 80) {
      warning = true;
      if (limits.users.percentage >= 95) {
        critical = true;
        messages.push(`Critical: User limit almost reached (${limits.users.current}/${limits.users.limit})`);
      } else {
        messages.push(`Warning: User limit at ${Math.round(limits.users.percentage)}% (${limits.users.current}/${limits.users.limit})`);
      }
    }

    if (limits.locations.limit && limits.locations.percentage >= 80) {
      warning = true;
      if (limits.locations.percentage >= 95) {
        critical = true;
        messages.push(`Critical: Location limit almost reached (${limits.locations.current}/${limits.locations.limit})`);
      } else {
        messages.push(`Warning: Location limit at ${Math.round(limits.locations.percentage)}% (${limits.locations.current}/${limits.locations.limit})`);
      }
    }

    return { warning, critical, messages };
  }
}