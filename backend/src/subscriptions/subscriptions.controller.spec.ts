import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStatus } from './entities/subscription.entity';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: SubscriptionsService;

  const mockRequest = {
    user: {
      id: 'user-id',
      tenant: {
        id: 'tenant-id',
      },
    },
  };

  const mockSubscriptionResponse = {
    id: 'sub-id',
    tenant_id: 'tenant-id',
    plan_name: 'standard',
    plan_display_name: 'Standaard',
    status: SubscriptionStatus.ACTIVE,
    current_period_start: new Date('2025-01-01'),
    current_period_end: new Date('2025-01-31'),
    days_remaining: 15,
    price_cents: 10000,
    price_euros: 100,
    usage: {
      cars_washed: { current: 750, limit: 1500, percentage: 50 },
      active_users: { current: 5, limit: 10, percentage: 50 },
      locations: { current: 1, limit: 3, percentage: 33 },
    },
    features: {
      api_access: true,
      advanced_reporting: true,
      custom_branding: false,
      priority_support: false,
      export_data: true,
      multi_location: true,
    },
  };

  const mockSubscriptionsService = {
    getCurrentSubscription: jest.fn(),
    getAvailablePlans: jest.fn(),
    getDetailedUsage: jest.fn(),
    getCurrentLimits: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentSubscription', () => {
    it('should return current subscription', async () => {
      mockSubscriptionsService.getCurrentSubscription.mockResolvedValue(
        mockSubscriptionResponse,
      );

      const result = await controller.getCurrentSubscription(mockRequest);

      expect(result).toEqual(mockSubscriptionResponse);
      expect(service.getCurrentSubscription).toHaveBeenCalledWith('tenant-id');
    });
  });

  describe('getAvailablePlans', () => {
    it('should return available plans', async () => {
      const mockPlans = [
        { id: '1', name: 'free', price_euros: 0 },
        { id: '2', name: 'standard', price_euros: 100 },
      ];
      mockSubscriptionsService.getAvailablePlans.mockResolvedValue(mockPlans);

      const result = await controller.getAvailablePlans(mockRequest);

      expect(result).toEqual(mockPlans);
      expect(service.getAvailablePlans).toHaveBeenCalledWith('tenant-id');
    });
  });

  describe('getDetailedUsage', () => {
    it('should return detailed usage', async () => {
      const mockUsage = {
        period_start: new Date('2025-01-01'),
        period_end: new Date('2025-01-31'),
        days_remaining: 15,
        cars_washed: {
          current: 750,
          limit: 1500,
          remaining: 750,
          percentage: 50,
          is_approaching_limit: false,
          is_at_limit: false,
        },
      };
      mockSubscriptionsService.getDetailedUsage.mockResolvedValue(mockUsage);

      const result = await controller.getDetailedUsage(mockRequest);

      expect(result).toEqual(mockUsage);
      expect(service.getDetailedUsage).toHaveBeenCalledWith('tenant-id');
    });
  });

  describe('getCurrentLimits', () => {
    it('should return current limits', async () => {
      const mockLimits = {
        limits: {
          cars_per_month: 1500,
          active_users: 10,
          locations: 3,
        },
        remaining_quota: {
          cars_per_month: 750,
          active_users: 5,
          locations: 2,
        },
        can_perform: {
          wash_car: true,
          create_user: true,
          create_location: true,
        },
      };
      mockSubscriptionsService.getCurrentLimits.mockResolvedValue(mockLimits);

      const result = await controller.getCurrentLimits(mockRequest);

      expect(result).toEqual(mockLimits);
      expect(service.getCurrentLimits).toHaveBeenCalledWith('tenant-id');
    });
  });
});
