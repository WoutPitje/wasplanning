import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { UsageService } from './usage.service';
import { UsageRecord, MetricType } from '../entities/usage-record.entity';
import { Subscription } from '../entities/subscription.entity';

import {
  mockUsageRecord,
  mockSubscription,
  recordUsageDto,
} from '../test/fixtures/subscription.fixtures';

describe('UsageService', () => {
  let service: UsageService;
  let usageRepository: Repository<UsageRecord>;
  let subscriptionRepository: Repository<Subscription>;

  const mockUsageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
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
          useValue: mockUsageRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    usageRepository = module.get<Repository<UsageRecord>>(
      getRepositoryToken(UsageRecord),
    );
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );

    jest.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should record usage successfully', async () => {
      const subscriptionId = 'sub-123';

      mockUsageRepository.create.mockReturnValue(mockUsageRecord);
      mockUsageRepository.save.mockResolvedValue(mockUsageRecord);

      const result = await service.recordUsage(subscriptionId, recordUsageDto);

      expect(mockUsageRepository.create).toHaveBeenCalledWith({
        subscriptionId,
        metricType: recordUsageDto.metricType,
        quantity: recordUsageDto.quantity,
        metadata: recordUsageDto.metadata,
      });
      expect(mockUsageRepository.save).toHaveBeenCalledWith(mockUsageRecord);
      expect(result).toEqual(mockUsageRecord);
    });
  });

  describe('getCurrentPeriodUsage', () => {
    it('should return aggregated usage for current period', async () => {
      const subscriptionId = 'sub-123';
      const mockUsageRecords = [
        { ...mockUsageRecord, metricType: MetricType.CARS_WASHED, quantity: 10 },
        { ...mockUsageRecord, metricType: MetricType.CARS_WASHED, quantity: 15 },
        { ...mockUsageRecord, metricType: MetricType.ACTIVE_USERS, quantity: 3 },
      ];

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRepository.find.mockResolvedValue(mockUsageRecords);

      const result = await service.getCurrentPeriodUsage(subscriptionId);

      expect(mockSubscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: subscriptionId },
      });
      expect(mockUsageRepository.find).toHaveBeenCalledWith({
        where: {
          subscriptionId,
          recordedAt: Between(mockSubscription.currentPeriodStart, mockSubscription.currentPeriodEnd),
        },
      });
      expect(result).toEqual({
        cars_washed: 25, // 10 + 15
        active_users: 3,
      });
    });

    it('should throw error when subscription not found', async () => {
      const subscriptionId = 'non-existent';

      mockSubscriptionRepository.findOne.mockResolvedValue(null);

      await expect(service.getCurrentPeriodUsage(subscriptionId))
        .rejects.toThrow('Subscription not found');
    });

    it('should filter by metric type when specified', async () => {
      const subscriptionId = 'sub-123';
      const metricType = MetricType.CARS_WASHED;

      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockUsageRepository.find.mockResolvedValue([mockUsageRecord]);

      await service.getCurrentPeriodUsage(subscriptionId, metricType);

      expect(mockUsageRepository.find).toHaveBeenCalledWith({
        where: {
          subscriptionId,
          metricType,
          recordedAt: Between(mockSubscription.currentPeriodStart, mockSubscription.currentPeriodEnd),
        },
      });
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history with date range', async () => {
      const subscriptionId = 'sub-123';
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockUsageRecords = [mockUsageRecord];

      mockUsageRepository.find.mockResolvedValue(mockUsageRecords);

      const result = await service.getUsageHistory(subscriptionId, startDate, endDate);

      expect(mockUsageRepository.find).toHaveBeenCalledWith({
        where: {
          subscriptionId,
          recordedAt: Between(startDate, endDate),
        },
        order: { recordedAt: 'DESC' },
      });
      expect(result).toEqual(mockUsageRecords);
    });

    it('should return usage history without date range', async () => {
      const subscriptionId = 'sub-123';
      const mockUsageRecords = [mockUsageRecord];

      mockUsageRepository.find.mockResolvedValue(mockUsageRecords);

      const result = await service.getUsageHistory(subscriptionId);

      expect(mockUsageRepository.find).toHaveBeenCalledWith({
        where: { subscriptionId },
        order: { recordedAt: 'DESC' },
      });
      expect(result).toEqual(mockUsageRecords);
    });
  });

  describe('recordCarWash', () => {
    it('should record car wash usage', async () => {
      const subscriptionId = 'sub-123';
      const metadata = { washTaskId: 'wash-123' };

      mockUsageRepository.create.mockReturnValue(mockUsageRecord);
      mockUsageRepository.save.mockResolvedValue(mockUsageRecord);

      const result = await service.recordCarWash(subscriptionId, metadata);

      expect(mockUsageRepository.create).toHaveBeenCalledWith({
        subscriptionId,
        metricType: MetricType.CARS_WASHED,
        quantity: 1,
        metadata,
      });
      expect(result).toEqual(mockUsageRecord);
    });
  });

  describe('recordActiveUser', () => {
    it('should record active user only once per day', async () => {
      const subscriptionId = 'sub-123';
      const userId = 'user-123';

      mockUsageRepository.findOne.mockResolvedValue(null); // No existing record
      mockUsageRepository.create.mockReturnValue(mockUsageRecord);
      mockUsageRepository.save.mockResolvedValue(mockUsageRecord);

      const result = await service.recordActiveUser(subscriptionId, userId);

      expect(mockUsageRepository.findOne).toHaveBeenCalled();
      expect(mockUsageRepository.create).toHaveBeenCalledWith({
        subscriptionId,
        metricType: MetricType.ACTIVE_USERS,
        quantity: 1,
        metadata: { userId },
      });
      expect(result).toEqual(mockUsageRecord);
    });

    it('should return existing record if user already recorded today', async () => {
      const subscriptionId = 'sub-123';
      const userId = 'user-123';
      const existingRecord = { ...mockUsageRecord, metadata: { userId } };

      mockUsageRepository.findOne.mockResolvedValue(existingRecord);

      const result = await service.recordActiveUser(subscriptionId, userId);

      expect(mockUsageRepository.create).not.toHaveBeenCalled();
      expect(mockUsageRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingRecord);
    });
  });

  describe('recordActiveLocation', () => {
    it('should record active location only once per day', async () => {
      const subscriptionId = 'sub-123';
      const locationId = 'location-123';

      mockUsageRepository.findOne.mockResolvedValue(null); // No existing record
      mockUsageRepository.create.mockReturnValue(mockUsageRecord);
      mockUsageRepository.save.mockResolvedValue(mockUsageRecord);

      const result = await service.recordActiveLocation(subscriptionId, locationId);

      expect(mockUsageRepository.findOne).toHaveBeenCalled();
      expect(mockUsageRepository.create).toHaveBeenCalledWith({
        subscriptionId,
        metricType: MetricType.ACTIVE_LOCATIONS,
        quantity: 1,
        metadata: { locationId },
      });
      expect(result).toEqual(mockUsageRecord);
    });

    it('should return existing record if location already recorded today', async () => {
      const subscriptionId = 'sub-123';
      const locationId = 'location-123';
      const existingRecord = { ...mockUsageRecord, metadata: { locationId } };

      mockUsageRepository.findOne.mockResolvedValue(existingRecord);

      const result = await service.recordActiveLocation(subscriptionId, locationId);

      expect(mockUsageRepository.create).not.toHaveBeenCalled();
      expect(mockUsageRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual(existingRecord);
    });
  });
});