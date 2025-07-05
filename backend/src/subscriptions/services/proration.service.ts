import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

export interface ProrationCalculation {
  currentPlanAmount: number;
  newPlanAmount: number;
  remainingDays: number;
  totalDays: number;
  prorationFactor: number;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
}

@Injectable()
export class ProrationService {
  private readonly logger = new Logger(ProrationService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
  ) {}

  async calculatePlanChangeProration(
    subscriptionId: string,
    newPlanId: string,
    changeDate: Date = new Date(),
  ): Promise<ProrationCalculation> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId },
    });

    if (!newPlan) {
      throw new Error('New plan not found');
    }

    const currentPlan = subscription.plan;
    const periodStart = subscription.currentPeriodStart;
    const periodEnd = subscription.currentPeriodEnd;

    // Calculate days
    const totalDays = Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
    const remainingDays = Math.ceil(
      (periodEnd.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate proration factor (percentage of period remaining)
    const prorationFactor = remainingDays / totalDays;

    // Calculate amounts
    const currentPlanAmount = currentPlan.priceMonthly;
    const newPlanAmount = newPlan.priceMonthly;

    // Credit for unused portion of current plan
    const creditAmount = currentPlanAmount * prorationFactor;

    // Charge for new plan for remaining period
    const chargeAmount = newPlanAmount * prorationFactor;

    // Net amount (positive = charge customer, negative = credit customer)
    const netAmount = chargeAmount - creditAmount;

    return {
      currentPlanAmount,
      newPlanAmount,
      remainingDays,
      totalDays,
      prorationFactor,
      creditAmount,
      chargeAmount,
      netAmount,
    };
  }

  async calculateUpgradeProration(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<ProrationCalculation> {
    const proration = await this.calculatePlanChangeProration(subscriptionId, newPlanId);

    // For upgrades, we typically charge immediately
    if (proration.netAmount > 0) {
      this.logger.log(
        `Upgrade proration: Customer will be charged ${proration.netAmount} immediately`,
      );
    } else {
      this.logger.log(
        `Upgrade proration: Customer will receive credit of ${Math.abs(proration.netAmount)}`,
      );
    }

    return proration;
  }

  async calculateDowngradeProration(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<ProrationCalculation> {
    const proration = await this.calculatePlanChangeProration(subscriptionId, newPlanId);

    // For downgrades, we typically apply credit to next bill
    if (proration.netAmount < 0) {
      this.logger.log(
        `Downgrade proration: Customer will receive credit of ${Math.abs(proration.netAmount)} on next bill`,
      );
    } else {
      this.logger.log(
        `Downgrade proration: Customer will be charged ${proration.netAmount} (unusual for downgrade)`,
      );
    }

    return proration;
  }

  async applyProration(
    subscriptionId: string,
    proration: ProrationCalculation,
  ): Promise<void> {
    // TODO: Create a proration transaction or credit
    // This would typically involve:
    // 1. Creating a payment transaction for the net amount
    // 2. If negative (credit), creating a credit entry for next bill
    // 3. If positive (charge), processing immediate payment

    this.logger.log(
      `Applied proration for subscription ${subscriptionId}: ${proration.netAmount}`,
    );
  }

  async getProrationPreview(
    subscriptionId: string,
    newPlanId: string,
  ): Promise<{
    proration: ProrationCalculation;
    recommendation: string;
    effectiveDate: Date;
  }> {
    const proration = await this.calculatePlanChangeProration(subscriptionId, newPlanId);

    let recommendation: string;
    if (proration.netAmount > 0) {
      recommendation = `You will be charged $${proration.netAmount.toFixed(2)} immediately for the upgrade.`;
    } else if (proration.netAmount < 0) {
      recommendation = `You will receive a $${Math.abs(proration.netAmount).toFixed(2)} credit on your next bill.`;
    } else {
      recommendation = 'No additional charge or credit will be applied.';
    }

    return {
      proration,
      recommendation,
      effectiveDate: new Date(), // Change takes effect immediately
    };
  }
}