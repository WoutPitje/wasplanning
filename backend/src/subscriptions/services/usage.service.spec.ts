import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageService } from './usage.service';
import { UsageRecord, MetricType } from '../entities/usage-record.entity';
import { Subscription } from '../entities/subscription.entity';
import { RecordUsageDto } from '../dto/record-usage.dto';
import { AuditService } from '../../audit/audit.service';

describe('UsageService', () => {
  let service: UsageService;
  let usageRecordRepository: Repository<UsageRecord>;
  let subscriptionRepository: Repository<Subscription>;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: getRepositoryToken(UsageRecord),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    usageRecordRepository = module.get<Repository<UsageRecord>>(
      getRepositoryToken(UsageRecord)
    );
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription)
    );
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordUsage', () => {
    it('should record usage successfully', async () => {
      const dto: RecordUsageDto = {
        metricType: MetricType.CARS_WASHED,
        quantity: 1,
        metadata: { washTaskId: 'wash-123' },
      };

      const mockUsageRecord = {
        id: 'usage-123',
        subscriptionId: 'sub-123',
        metricType: MetricType.CARS_WASHED,
        quantity: 1,
        metadata: { washTaskId: 'wash-123' },
      };

      const mockSubscription = {
        id: 'sub-123',
        tenantId: 'tenant-123',
      };

      (usageRecordRepository.create as jest.Mock).mockReturnValue(mockUsageRecord);
      (usageRecordRepository.save as jest.Mock).mockResolvedValue(mockUsageRecord);
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.recordUsage('sub-123', dto);

      expect(result).toEqual(mockUsageRecord);
      expect(usageRecordRepository.create).toHaveBeenCalledWith({
        subscriptionId: 'sub-123',
        metricType: MetricType.CARS_WASHED,
        quantity: 1,
        metadata: { washTaskId: 'wash-123' },
      });
      expect(auditService.logAction).toHaveBeenCalled();
    });

    it('should handle errors when recording usage', async () => {
      const dto: RecordUsageDto = {
        metricType: MetricType.CARS_WASHED,
        quantity: 1,
      };

      (usageRecordRepository.create as jest.Mock).mockReturnValue({});
      (usageRecordRepository.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.recordUsage('sub-123', dto)).rejects.toThrow('Database error');
    });
  });

  describe('getCurrentPeriodUsage', () => {
    it('should calculate current period usage correctly', async () => {
      const mockSubscription = {
        id: 'sub-123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-01-31'),
      };

      const mockUsageRecords = [
        { metricType: MetricType.CARS_WASHED, quantity: 5 },
        { metricType: MetricType.CARS_WASHED, quantity: 3 },
        { metricType: MetricType.ACTIVE_USERS, quantity: 1 },
      ];

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (usageRecordRepository.find as jest.Mock).mockResolvedValue(mockUsageRecords);

      const result = await service.getCurrentPeriodUsage('sub-123');

      expect(result).toEqual({
        [MetricType.CARS_WASHED]: 8,
        [MetricType.ACTIVE_USERS]: 1,
      });
    });

    it('should handle empty usage data', async () => {
      const mockSubscription = {
        id: 'sub-123',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-01-31'),
      };

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (usageRecordRepository.find as jest.Mock).mockResolvedValue([]);

      const result = await service.getCurrentPeriodUsage('sub-123');

      expect(result).toEqual({});
    });
  });

  describe('recordActiveUser', () => {
    it('should record active user successfully', async () => {
      const mockUsageRecord = {
        id: 'usage-123',
        subscriptionId: 'sub-123',
        metricType: MetricType.ACTIVE_USERS,
        metadata: { userId: 'user-456' },
      };

      (usageRecordRepository.findOne as jest.Mock).mockResolvedValue(null);
      (usageRecordRepository.create as jest.Mock).mockReturnValue(mockUsageRecord);
      (usageRecordRepository.save as jest.Mock).mockResolvedValue(mockUsageRecord);

      const result = await service.recordActiveUser('sub-123', 'user-456');

      expect(result).toEqual(mockUsageRecord);
    });

    it('should return existing record if user already recorded today', async () => {
      const existingRecord = {
        id: 'existing-123',
        subscriptionId: 'sub-123',
        metricType: MetricType.ACTIVE_USERS,
        metadata: { userId: 'user-456' },
      };

      (usageRecordRepository.findOne as jest.Mock).mockResolvedValue(existingRecord);

      const result = await service.recordActiveUser('sub-123', 'user-456');

      expect(result).toEqual(existingRecord);
      expect(usageRecordRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('recordActiveLocation', () => {
    it('should record active location successfully', async () => {
      const mockUsageRecord = {
        id: 'usage-123',
        subscriptionId: 'sub-123',
        metricType: MetricType.ACTIVE_LOCATIONS,
        metadata: { locationId: 'loc-456' },
      };

      (usageRecordRepository.findOne as jest.Mock).mockResolvedValue(null);
      (usageRecordRepository.create as jest.Mock).mockReturnValue(mockUsageRecord);
      (usageRecordRepository.save as jest.Mock).mockResolvedValue(mockUsageRecord);

      const result = await service.recordActiveLocation('sub-123', 'loc-456');

      expect(result).toEqual(mockUsageRecord);
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history', async () => {
      const mockRecords = [
        {
          id: '1',
          metricType: MetricType.CARS_WASHED,
          quantity: 5,
          recordedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          metricType: MetricType.CARS_WASHED,
          quantity: 3,
          recordedAt: new Date('2024-01-02'),
        },
      ];

      (usageRecordRepository.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.getUsageHistory(
        'sub-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual(mockRecords);
    });
  });

  describe('getUsageSummary', () => {
    it('should return aggregated usage summary', async () => {
      const mockRecords = [
        { metricType: MetricType.CARS_WASHED, quantity: 5 },
        { metricType: MetricType.CARS_WASHED, quantity: 3 },
        { metricType: MetricType.ACTIVE_USERS, quantity: 1 },
      ];

      (usageRecordRepository.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.getUsageSummary(
        'sub-123',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(result).toEqual({
        [MetricType.CARS_WASHED]: 8,
        [MetricType.ACTIVE_USERS]: 1,
      });
    });
  });

  describe('getDailyUsage', () => {
    it('should return daily usage breakdown', async () => {
      const mockRecords = [
        {
          metricType: MetricType.CARS_WASHED,
          quantity: 5,
          recordedAt: new Date('2024-01-01'),
        },
        {
          metricType: MetricType.CARS_WASHED,
          quantity: 3,
          recordedAt: new Date('2024-01-01'),
        },
        {
          metricType: MetricType.CARS_WASHED,
          quantity: 2,
          recordedAt: new Date('2024-01-02'),
        },
      ];

      (usageRecordRepository.find as jest.Mock).mockResolvedValue(mockRecords);

      const result = await service.getDailyUsage(
        'sub-123',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result).toEqual([
        { date: '2024-01-01', cars_washed: 8 },
        { date: '2024-01-02', cars_washed: 2 },
      ]);
    });
  });
});