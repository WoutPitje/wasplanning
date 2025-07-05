import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { SubscriptionPlan, PlanName } from './entities/subscription-plan.entity';
import { PaymentsService } from '../payments/payments.service';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { AuditService } from '../audit/audit.service';

import {
  mockSubscription,
  mockSubscriptionPlan,
  mockGroeiPlan,
  createSubscriptionDto,
  updateSubscriptionDto,
  mockTenant,
} from './test/fixtures/subscription.fixtures';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: Repository<Subscription>;
  let planRepository: Repository<SubscriptionPlan>;
  let paymentsService: PaymentsService;
  let usageService: UsageService;
  let limitsService: LimitsService;

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPlanRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockPaymentsService = {
    createSubscription: jest.fn(),
  };

  const mockUsageService = {
    getCurrentPeriodUsage: jest.fn(),
    recordUsage: jest.fn(),
    recordActiveUser: jest.fn(),
    recordActiveLocation: jest.fn(),
  };

  const mockLimitsService = {
    getAllLimits: jest.fn(),
    getLimitWarnings: jest.fn(),
    checkLimit: jest.fn(),
    hasFeature: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

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
          useValue: mockPlanRepository,
        },
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: UsageService,
          useValue: mockUsageService,
        },
        {
          provide: LimitsService,
          useValue: mockLimitsService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    planRepository = module.get<Repository<SubscriptionPlan>>(
      getRepositoryToken(SubscriptionPlan),
    );
    paymentsService = module.get<PaymentsService>(PaymentsService);
    usageService = module.get<UsageService>(UsageService);
    limitsService = module.get<LimitsService>(LimitsService);

    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(null); // No existing subscription
      mockPlanRepository.findOne.mockResolvedValue(mockSubscriptionPlan);
      mockSubscriptionRepository.create.mockReturnValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription(tenantId, createSubscriptionDto);

      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { name: createSubscriptionDto.planName, isActive: true },
      });
      expect(mockSubscriptionRepository.create).toHaveBeenCalled();
      expect(mockSubscriptionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSubscription);
    });

    it('should throw BadRequestException when tenant already has subscription', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      await expect(service.createSubscription(tenantId, createSubscriptionDto))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when plan not found', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);
      mockPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.createSubscription(tenantId, createSubscriptionDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getCurrentSubscription', () => {
    it('should return current subscription with plan', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      const result = await service.getCurrentSubscription(tenantId);

      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId },
        relations: ['plan'],
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should return null when no subscription found', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentSubscription(tenantId);

      expect(result).toBeNull();
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const tenantId = 'tenant-123';
      const subscriptionId = 'sub-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockPlanRepository.findOne.mockResolvedValue(mockGroeiPlan);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        planId: 'plan-456',
      });

      const result = await service.updateSubscription(
        tenantId,
        subscriptionId,
        updateSubscriptionDto,
      );

      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: subscriptionId, tenantId },
        relations: ['plan'],
      });
      expect(mockPlanRepository.findOne).toHaveBeenCalledWith({
        where: { name: updateSubscriptionDto.planName, isActive: true },
      });
      expect(mockSubscriptionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when subscription not found', async () => {
      const tenantId = 'tenant-123';
      const subscriptionId = 'non-existent';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSubscription(tenantId, subscriptionId, updateSubscriptionDto))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const tenantId = 'tenant-123';
      const subscriptionId = 'sub-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
      });

      const result = await service.cancelSubscription(tenantId, subscriptionId, true);

      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(result.canceledAt).toBeDefined();
    });

    it('should schedule cancellation at period end', async () => {
      const tenantId = 'tenant-123';
      const subscriptionId = 'sub-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
      });

      const result = await service.cancelSubscription(tenantId, subscriptionId, false);

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.canceledAt).toBeDefined();
    });
  });

  describe('getAvailablePlans', () => {
    it('should return active plans ordered by price', async () => {
      const mockPlans = [mockSubscriptionPlan, mockGroeiPlan];

      mockPlanRepository.find.mockResolvedValue(mockPlans);

      const result = await service.getAvailablePlans();

      expect(mockPlanRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { priceMonthly: 'ASC' },
      });
      expect(result).toEqual(mockPlans);
    });
  });

  describe('getCurrentUsage', () => {
    it('should return current usage with limits and warnings', async () => {
      const tenantId = 'tenant-123';
      const mockUsage = { cars_washed: 100, active_users: 3 };
      const mockLimits = {
        cars: { allowed: true, current: 100, limit: 500, percentage: 20 },
        users: { allowed: true, current: 3, limit: 5, percentage: 60 },
        locations: { allowed: true, current: 1, limit: 1, percentage: 100 },
        features: { basic_features: true },
      };
      const mockWarnings = { warning: false, critical: false, messages: [] };

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getCurrentPeriodUsage.mockResolvedValue(mockUsage);
      mockLimitsService.getAllLimits.mockResolvedValue(mockLimits);
      mockLimitsService.getLimitWarnings.mockResolvedValue(mockWarnings);

      const result = await service.getCurrentUsage(tenantId);

      expect(result).toEqual({
        subscription: expect.objectContaining({
          id: mockSubscription.id,
          plan: mockSubscription.plan,
          status: mockSubscription.status,
        }),
        usage: mockUsage,
        limits: mockLimits,
        warnings: mockWarnings,
      });
    });

    it('should throw NotFoundException when no subscription found', async () => {
      const tenantId = 'tenant-123';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentUsage(tenantId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('recordUsage', () => {
    it('should record usage when subscription exists', async () => {
      const tenantId = 'tenant-123';
      const metricType = 'cars_washed';
      const quantity = 1;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      await service.recordUsage(tenantId, metricType, quantity);

      expect(mockUsageService.recordUsage).toHaveBeenCalledWith(mockSubscription.id, {
        metricType,
        quantity,
        metadata: undefined,
      });
    });

    it('should skip recording when no subscription found', async () => {
      const tenantId = 'tenant-123';
      const metricType = 'cars_washed';
      const quantity = 1;

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await service.recordUsage(tenantId, metricType, quantity);

      expect(mockUsageService.recordUsage).not.toHaveBeenCalled();
    });
  });

  describe('checkLimit', () => {
    it('should return limit check result', async () => {
      const tenantId = 'tenant-123';
      const metricType = 'cars_washed';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.checkLimit.mockResolvedValue({ allowed: true, current: 100, percentage: 20 });

      const result = await service.checkLimit(tenantId, metricType);

      expect(mockLimitsService.checkLimit).toHaveBeenCalledWith(mockSubscription.id, metricType);
      expect(result).toBe(true);
    });

    it('should return true when no subscription found (for trials)', async () => {
      const tenantId = 'tenant-123';
      const metricType = 'cars_washed';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.checkLimit(tenantId, metricType);

      expect(result).toBe(true);
    });
  });

  describe('hasFeature', () => {
    it('should check feature availability', async () => {
      const tenantId = 'tenant-123';
      const featureName = 'advanced_reporting';

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockLimitsService.hasFeature.mockResolvedValue(false);

      const result = await service.hasFeature(tenantId, featureName);

      expect(mockLimitsService.hasFeature).toHaveBeenCalledWith(mockSubscription.id, featureName);
      expect(result).toBe(false);
    });

    it('should return false when no subscription found', async () => {
      const tenantId = 'tenant-123';
      const featureName = 'advanced_reporting';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.hasFeature(tenantId, featureName);

      expect(result).toBe(false);
    });
  });
});