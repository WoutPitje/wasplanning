import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LimitsService, LimitType } from './limits.service';
import { UsageService } from './usage.service';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { UsageType } from '../entities/usage-record.entity';
import { User } from '../../auth/entities/user.entity';

describe('LimitsService', () => {
  let service: LimitsService;
  let subscriptionRepository: Repository<Subscription>;
  let subscriptionPlanRepository: Repository<SubscriptionPlan>;
  let userRepository: Repository<User>;
  let usageService: UsageService;

  const mockTenantId = 'test-tenant-id';

  const mockPlan = {
    id: 'plan-id',
    name: 'standard',
    max_cars_per_month: 1500,
    max_active_users: 10,
    max_locations: 3,
  };

  const mockSubscription = {
    tenant_id: mockTenantId,
    status: 'active',
    plan: mockPlan,
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
  };

  const mockSubscriptionPlanRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    count: jest.fn(),
  };

  const mockUsageService = {
    getMonthlyUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LimitsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockSubscriptionPlanRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UsageService,
          useValue: mockUsageService,
        },
      ],
    }).compile();

    service = module.get<LimitsService>(LimitsService);
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(
      getRepositoryToken(SubscriptionPlan),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    usageService = module.get<UsageService>(UsageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canWashCar', () => {
    it('should return true when under limit', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage.mockResolvedValue(100);

      const result = await service.canWashCar(mockTenantId);

      expect(result).toBe(true);
      expect(mockUsageService.getMonthlyUsage).toHaveBeenCalledWith(
        mockTenantId,
        UsageType.CARS_WASHED,
      );
    });

    it('should return false when at limit', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage.mockResolvedValue(1500);

      const result = await service.canWashCar(mockTenantId);

      expect(result).toBe(false);
    });

    it('should return true when limit is null (unlimited)', async () => {
      const unlimitedPlan = {
        ...mockSubscription,
        plan: {
          ...mockPlan,
          max_cars_per_month: null,
        },
      };
      mockSubscriptionRepository.findOne.mockResolvedValue(unlimitedPlan);

      const result = await service.canWashCar(mockTenantId);

      expect(result).toBe(true);
      expect(mockUsageService.getMonthlyUsage).not.toHaveBeenCalled();
    });
  });

  describe('canCreateUser', () => {
    it('should return true when under limit', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUserRepository.count.mockResolvedValue(5);

      const result = await service.canCreateUser(mockTenantId);

      expect(result).toBe(true);
      expect(mockUserRepository.count).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          is_active: true,
        },
      });
    });

    it('should return false when at limit', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUserRepository.count.mockResolvedValue(10);

      const result = await service.canCreateUser(mockTenantId);

      expect(result).toBe(false);
    });

    it('should return true when limit is null (unlimited)', async () => {
      const unlimitedPlan = {
        ...mockSubscription,
        plan: {
          ...mockPlan,
          max_active_users: null,
        },
      };
      mockSubscriptionRepository.findOne.mockResolvedValue(unlimitedPlan);

      const result = await service.canCreateUser(mockTenantId);

      expect(result).toBe(true);
      expect(mockUserRepository.count).not.toHaveBeenCalled();
    });
  });

  describe('getUsagePercentage', () => {
    it('should calculate percentage correctly', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage.mockResolvedValue(750);

      const result = await service.getUsagePercentage(
        mockTenantId,
        LimitType.CARS_WASHED,
      );

      expect(result).toBe(50);
    });

    it('should return 0 for unlimited (null) limits', async () => {
      const unlimitedPlan = {
        ...mockSubscription,
        plan: {
          ...mockPlan,
          max_cars_per_month: null,
        },
      };
      mockSubscriptionRepository.findOne.mockResolvedValue(unlimitedPlan);

      const result = await service.getUsagePercentage(
        mockTenantId,
        LimitType.CARS_WASHED,
      );

      expect(result).toBe(0);
    });

    it('should calculate active users percentage correctly', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUserRepository.count.mockResolvedValue(5);

      const result = await service.getUsagePercentage(
        mockTenantId,
        LimitType.ACTIVE_USERS,
      );

      expect(result).toBe(50);
    });
  });

  describe('isApproachingLimit', () => {
    it('should return true when at 80% or above', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage.mockResolvedValue(1200); // 80% of 1500

      const result = await service.isApproachingLimit(
        mockTenantId,
        LimitType.CARS_WASHED,
      );

      expect(result).toBe(true);
    });

    it('should return false when below 80%', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage.mockResolvedValue(1000);

      const result = await service.isApproachingLimit(
        mockTenantId,
        LimitType.CARS_WASHED,
      );

      expect(result).toBe(false);
    });
  });

  describe('getLimitsAndUsage', () => {
    it('should return complete limits and usage info', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageService.getMonthlyUsage
        .mockResolvedValueOnce(750) // cars (first call)
        .mockResolvedValueOnce(750); // cars (for percentage calculation)
      mockUserRepository.count
        .mockResolvedValueOnce(5) // users (first call)
        .mockResolvedValueOnce(5); // users (for percentage calculation)

      const result = await service.getLimitsAndUsage(mockTenantId);

      expect(result).toEqual({
        cars_washed: {
          current: 750,
          limit: 1500,
          percentage: 50,
        },
        active_users: {
          current: 5,
          limit: 10,
          percentage: 50,
        },
        locations: {
          current: 0,
          limit: 3,
          percentage: 0,
        },
      });
    });
  });
});
