import { Test, TestingModule } from '@nestjs/testing';
import { ProrationService } from './proration.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

describe('ProrationService', () => {
  let service: ProrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProrationService],
    }).compile();

    service = module.get<ProrationService>(ProrationService);
  });

  describe('calculateProration', () => {
    it('should return 0 for non-immediate changes', () => {
      const subscription = createMockSubscription(10000); // €100
      const newPlan = createMockPlan(40000); // €400

      const proration = service.calculateProration(
        subscription,
        newPlan,
        false,
      );

      expect(proration).toBe(0);
    });

    it('should calculate upgrade proration correctly', () => {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(1); // Start of month
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // End of month

      // Mid-month upgrade
      now.setDate(15);

      const subscription = createMockSubscription(
        10000,
        periodStart,
        periodEnd,
      ); // €100
      const newPlan = createMockPlan(40000); // €400

      const proration = service.calculateProration(subscription, newPlan, true);

      // Should charge the difference for remaining days
      expect(proration).toBeGreaterThan(0);
      expect(proration).toBeLessThan(30000); // Less than full price difference
    });

    it('should handle free to paid upgrade', () => {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setDate(1); // Start of month
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // End of month

      const subscription = createMockSubscription(0, periodStart, periodEnd); // Free plan
      const newPlan = createMockPlan(10000); // €100

      const proration = service.calculateProration(subscription, newPlan, true);

      // Proration should be proportional to days remaining
      expect(proration).toBeGreaterThan(0);
      expect(proration).toBeLessThanOrEqual(10000);
    });

    it('should return full price if period ended', () => {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setMonth(periodStart.getMonth() - 2); // 2 months ago
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() - 1); // Yesterday

      const subscription = createMockSubscription(
        10000,
        periodStart,
        periodEnd,
      );
      const newPlan = createMockPlan(40000);

      const proration = service.calculateProration(subscription, newPlan, true);

      expect(proration).toBe(40000); // Full price
    });
  });

  describe('getNextBillingDate', () => {
    it('should return current period end for non-immediate changes', () => {
      const periodEnd = new Date('2024-02-29');
      const nextBilling = service.getNextBillingDate(false, periodEnd);

      expect(nextBilling).toEqual(periodEnd);
    });

    it('should return one month from now for immediate changes', () => {
      const periodEnd = new Date('2024-02-29');
      const now = new Date();
      const nextBilling = service.getNextBillingDate(true, periodEnd);

      expect(nextBilling.getMonth()).toBe((now.getMonth() + 1) % 12);
    });
  });

  describe('formatProrationDetails', () => {
    it('should format positive proration as charge', () => {
      const details = service.formatProrationDetails(5000);

      expect(details.description).toContain('charge');
      expect(details.amount).toBe(5000);
      expect(details.isCredit).toBe(false);
    });

    it('should format negative proration as credit', () => {
      const details = service.formatProrationDetails(-2000);

      expect(details.description).toContain('Credit');
      expect(details.amount).toBe(2000);
      expect(details.isCredit).toBe(true);
    });
  });
});

function createMockSubscription(
  planPrice: number,
  periodStart?: Date,
  periodEnd?: Date,
): Subscription {
  const now = new Date();
  return {
    id: 'sub-123',
    tenant_id: 'tenant-123',
    plan_id: 'plan-123',
    plan: {
      id: 'plan-123',
      name: 'current',
      display_name: 'Current Plan',
      price_cents: planPrice,
      max_cars_per_month: 100,
      max_active_users: 5,
      max_locations: 1,
    } as SubscriptionPlan,
    status: SubscriptionStatus.ACTIVE,
    current_period_start:
      periodStart || new Date(now.getFullYear(), now.getMonth(), 1),
    current_period_end:
      periodEnd || new Date(now.getFullYear(), now.getMonth() + 1, 0),
  } as Subscription;
}

function createMockPlan(price: number): SubscriptionPlan {
  return {
    id: 'plan-456',
    name: 'new',
    display_name: 'New Plan',
    price_cents: price,
    max_cars_per_month: 1000,
    max_active_users: 10,
    max_locations: 3,
  } as SubscriptionPlan;
}
