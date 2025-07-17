import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  Subscription,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { LimitsService } from './services/limits.service';
import { UsageService } from './services/usage.service';
import { BillingService } from './services/billing.service';
import { ProrationService } from './services/proration.service';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: Repository<Subscription>;
  let subscriptionPlanRepository: Repository<SubscriptionPlan>;
  let limitsService: LimitsService;

  const mockTenantId = 'test-tenant-id';

  const mockPlan = {
    id: 'plan-id',
    name: 'standard',
    display_name: 'Standaard',
    price_cents: 10000,
    max_cars_per_month: 1500,
    max_active_users: 10,
    max_locations: 3,
    features: {
      api_access: true,
      advanced_reporting: true,
      custom_branding: false,
      priority_support: false,
      export_data: true,
      multi_location: true,
    },
  };

  const mockSubscription = {
    id: 'sub-id',
    tenant_id: mockTenantId,
    status: SubscriptionStatus.ACTIVE,
    current_period_start: new Date('2025-01-01'),
    current_period_end: new Date('2025-01-31'),
    plan: mockPlan,
    stripe_customer_id: 'cus_123',
    stripe_subscription_id: 'sub_123',
  };

  const mockUsage = {
    cars_washed: { current: 750, limit: 1500, percentage: 50 },
    active_users: { current: 5, limit: 10, percentage: 50 },
    locations: { current: 1, limit: 3, percentage: 33 },
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionPlanRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockLimitsService = {
    getLimitsAndUsage: jest.fn(),
    canWashCar: jest.fn(),
    canCreateUser: jest.fn(),
    canCreateLocation: jest.fn(),
  };

  const mockUsageService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockSubscriptionPlanRepository,
        },
        {
          provide: LimitsService,
          useValue: mockLimitsService,
        },
        {
          provide: UsageService,
          useValue: mockUsageService,
        },
        {
          provide: BillingService,
          useValue: {},
        },
        {
          provide: ProrationService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(
      getRepositoryToken(SubscriptionPlan),
    );
    limitsService = module.get<LimitsService>(LimitsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSubscription', () => {
    it('should return current subscription with usage', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.getLimitsAndUsage.mockResolvedValue(mockUsage);

      const result = await service.getCurrentSubscription(mockTenantId);

      expect(result).toMatchObject({
        id: 'sub-id',
        tenant_id: mockTenantId,
        plan_name: 'standard',
        plan_display_name: 'Standaard',
        status: SubscriptionStatus.ACTIVE,
        price_cents: 10000,
        price_euros: 100,
        usage: mockUsage,
        features: mockPlan.features,
      });
      expect(result.days_remaining).toBeGreaterThanOrEqual(0);
    });

    it('should throw Error when no subscription found and free plan is missing', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(null);
      mockSubscriptionPlanRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getCurrentSubscription(mockTenantId),
      ).rejects.toThrow(
        'Free plan not found in database. Please run seed data.',
      );
    });
  });

  describe('getAvailablePlans', () => {
    it('should return all plans with current plan marked', async () => {
      const plans = [
        { ...mockPlan, id: '1', name: 'free', price_cents: 0 },
        { ...mockPlan, id: 'plan-id', name: 'standard', price_cents: 10000 }, // Use same ID as mockPlan
        { ...mockPlan, id: '3', name: 'enterprise', price_cents: 40000 },
      ];
      mockSubscriptionPlanRepository.find.mockResolvedValue(plans);
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getAvailablePlans(mockTenantId);

      expect(result).toHaveLength(3);
      expect(result[0].price_display).toBe('€0,00/maand');
      expect(result[1].price_display).toBe('€100,00/maand');
      expect(result[2].price_display).toBe('€400,00/maand');
      expect(result[1].is_current).toBe(true);
      expect(result[1].is_recommended).toBe(true);
    });
  });

  describe('getDetailedUsage', () => {
    it('should return detailed usage with summary', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.getLimitsAndUsage.mockResolvedValue(mockUsage);

      const result = await service.getDetailedUsage(mockTenantId);

      expect(result.cars_washed).toMatchObject({
        current: 750,
        limit: 1500,
        remaining: 750,
        percentage: 50,
        is_approaching_limit: false,
        is_at_limit: false,
      });
      expect(result.summary.at_limit).toEqual([]);
      expect(result.summary.approaching_limit).toEqual([]);
    });

    it('should identify items approaching limit', async () => {
      const highUsage = {
        cars_washed: { current: 1200, limit: 1500, percentage: 80 },
        active_users: { current: 9, limit: 10, percentage: 90 },
        locations: { current: 3, limit: 3, percentage: 100 },
      };
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.getLimitsAndUsage.mockResolvedValue(highUsage);

      const result = await service.getDetailedUsage(mockTenantId);

      expect(result.summary.at_limit).toEqual(['locations']);
      expect(result.summary.approaching_limit).toEqual([
        'cars_washed',
        'active_users',
      ]);
    });
  });

  describe('getCurrentLimits', () => {
    it('should return limits with remaining quota and permissions', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.getLimitsAndUsage.mockResolvedValue(mockUsage);
      mockLimitsService.canWashCar.mockResolvedValue(true);
      mockLimitsService.canCreateUser.mockResolvedValue(true);
      mockLimitsService.canCreateLocation.mockResolvedValue(true);

      const result = await service.getCurrentLimits(mockTenantId);

      expect(result.limits).toEqual({
        cars_per_month: 1500,
        active_users: 10,
        locations: 3,
      });
      expect(result.remaining_quota).toEqual({
        cars_per_month: 750,
        active_users: 5,
        locations: 2,
      });
      expect(result.can_perform).toEqual({
        wash_car: true,
        create_user: true,
        create_location: true,
      });
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate days correctly', () => {
      const service = new SubscriptionsService(
        subscriptionRepository,
        subscriptionPlanRepository,
        limitsService,
        null as any,
        null as any,
        null as any,
      );

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const result = (service as any).calculateDaysRemaining(futureDate);

      expect(result).toBe(15);
    });

    it('should return 0 for past dates', () => {
      const service = new SubscriptionsService(
        subscriptionRepository,
        subscriptionPlanRepository,
        limitsService,
        null as any,
        null as any,
        null as any,
      );

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const result = (service as any).calculateDaysRemaining(pastDate);

      expect(result).toBe(0);
    });
  });
});
