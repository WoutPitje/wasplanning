import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BillingCycle, BillingCycleStatus } from '../entities/billing-cycle.entity';
import { Subscription } from '../entities/subscription.entity';
import { UsageService } from './usage.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(BillingCycle)
    private billingCycleRepository: Repository<BillingCycle>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private usageService: UsageService,
  ) {}

  async createBillingCycle(
    subscriptionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BillingCycle> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Calculate base amount (subscription fee)
    const baseAmount = subscription.plan.priceMonthly;

    // Calculate usage amount (overage charges)
    const usageSummary = await this.usageService.getUsageSummary(
      subscriptionId,
      startDate,
      endDate,
    );

    let usageAmount = 0;
    const plan = subscription.plan;

    // Calculate overage charges
    if (plan.overagePricePerCar && usageSummary.cars_washed) {
      const overageCars = Math.max(0, usageSummary.cars_washed - (plan.maxCarsPerMonth || 0));
      usageAmount += overageCars * plan.overagePricePerCar;
    }

    if (plan.overagePricePerLocation && usageSummary.active_locations) {
      const overageLocations = Math.max(0, usageSummary.active_locations - (plan.maxLocations || 0));
      usageAmount += overageLocations * plan.overagePricePerLocation;
    }

    const totalAmount = baseAmount + usageAmount;

    const billingCycle = this.billingCycleRepository.create({
      subscriptionId,
      startDate,
      endDate,
      baseAmount,
      usageAmount,
      totalAmount,
      usageSummary,
      status: BillingCycleStatus.PENDING,
    });

    return await this.billingCycleRepository.save(billingCycle);
  }

  async getBillingCycles(subscriptionId: string): Promise<BillingCycle[]> {
    return await this.billingCycleRepository.find({
      where: { subscriptionId },
      order: { startDate: 'DESC' },
    });
  }

  async getUpcomingBill(subscriptionId: string): Promise<any> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Get current period usage
    const currentUsage = await this.usageService.getCurrentPeriodUsage(subscriptionId);

    // Calculate estimated bill
    const baseAmount = subscription.plan.priceMonthly;
    let estimatedUsageAmount = 0;

    const plan = subscription.plan;
    if (plan.overagePricePerCar && currentUsage.cars_washed) {
      const overageCars = Math.max(0, currentUsage.cars_washed - (plan.maxCarsPerMonth || 0));
      estimatedUsageAmount += overageCars * plan.overagePricePerCar;
    }

    return {
      nextBillingDate: subscription.currentPeriodEnd,
      baseAmount,
      estimatedUsageAmount,
      estimatedTotal: baseAmount + estimatedUsageAmount,
      currentUsage,
    };
  }

  async markBillingCyclePaid(billingCycleId: string, invoiceId?: string): Promise<BillingCycle> {
    const billingCycle = await this.billingCycleRepository.findOne({
      where: { id: billingCycleId },
    });

    if (!billingCycle) {
      throw new Error('Billing cycle not found');
    }

    billingCycle.status = BillingCycleStatus.PAID;
    billingCycle.paidAt = new Date();
    if (invoiceId) {
      billingCycle.invoiceId = invoiceId;
    }

    return await this.billingCycleRepository.save(billingCycle);
  }

  async markBillingCycleFailed(billingCycleId: string): Promise<BillingCycle> {
    const billingCycle = await this.billingCycleRepository.findOne({
      where: { id: billingCycleId },
    });

    if (!billingCycle) {
      throw new Error('Billing cycle not found');
    }

    billingCycle.status = BillingCycleStatus.FAILED;

    return await this.billingCycleRepository.save(billingCycle);
  }
}