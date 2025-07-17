import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageService } from './usage.service';
import { UsageRecord, UsageType } from '../entities/usage-record.entity';
import { Subscription } from '../entities/subscription.entity';

describe('UsageService', () => {
  let service: UsageService;
  let usageRecordRepository: Repository<UsageRecord>;
  let subscriptionRepository: Repository<Subscription>;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  const mockSubscription = {
    tenant_id: mockTenantId,
    current_period_start: new Date('2025-01-01'),
    current_period_end: new Date('2025-01-31'),
  };

  const mockUsageRecordRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: getRepositoryToken(UsageRecord),
          useValue: mockUsageRecordRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    usageRecordRepository = module.get<Repository<UsageRecord>>(
      getRepositoryToken(UsageRecord),
    );
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('incrementCarCount', () => {
    it('should increment car count atomically', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);

      await service.incrementCarCount(mockTenantId);

      expect(mockUsageRecordRepository.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO usage_records'),
        [
          mockTenantId,
          UsageType.CARS_WASHED,
          mockSubscription.current_period_start,
          mockSubscription.current_period_end,
        ],
      );
    });
  });

  describe('getMonthlyUsage', () => {
    it('should return usage count for cars washed', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRecordRepository.findOne.mockResolvedValue({
        count: 42,
      });

      const result = await service.getMonthlyUsage(
        mockTenantId,
        UsageType.CARS_WASHED,
      );

      expect(result).toBe(42);
      expect(mockUsageRecordRepository.findOne).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          record_type: UsageType.CARS_WASHED,
          period_start: mockSubscription.current_period_start,
        },
      });
    });

    it('should return 0 if no usage record exists', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRecordRepository.findOne.mockResolvedValue(null);

      const result = await service.getMonthlyUsage(
        mockTenantId,
        UsageType.CARS_WASHED,
      );

      expect(result).toBe(0);
    });
  });

  describe('initializeMonthlyRecords', () => {
    it('should create usage records for all types', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRecordRepository.findOne.mockResolvedValue(null);

      await service.initializeMonthlyRecords(mockTenantId);

      expect(mockUsageRecordRepository.save).toHaveBeenCalledTimes(2);
      expect(mockUsageRecordRepository.save).toHaveBeenCalledWith({
        tenant_id: mockTenantId,
        record_type: UsageType.CARS_WASHED,
        period_start: mockSubscription.current_period_start,
        period_end: mockSubscription.current_period_end,
        count: 0,
      });
      expect(mockUsageRecordRepository.save).toHaveBeenCalledWith({
        tenant_id: mockTenantId,
        record_type: UsageType.ACTIVE_USERS,
        period_start: mockSubscription.current_period_start,
        period_end: mockSubscription.current_period_end,
        count: 0,
      });
    });

    it('should not create duplicate records', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRecordRepository.findOne.mockResolvedValue({
        id: 'existing-record',
      });

      await service.initializeMonthlyRecords(mockTenantId);

      expect(mockUsageRecordRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics for current period', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRecordRepository.findOne
        .mockResolvedValueOnce({ count: 25 }) // cars
        .mockResolvedValueOnce({ count: 5 }); // users

      const result = await service.getUsageStats(mockTenantId);

      expect(result).toEqual({
        cars_washed: 25,
        active_users: 5,
        period_start: mockSubscription.current_period_start,
        period_end: mockSubscription.current_period_end,
      });
    });
  });
});
