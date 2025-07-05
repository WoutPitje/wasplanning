import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
    
    // Reset mocks
    jest.clearAllMocks();
    mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logAction', () => {
    it('should create and save an audit log', async () => {
      const auditData = {
        tenant_id: 'tenant-123',
        user_id: 'user-123',
        action: 'user.created',
        resource_type: 'user',
        resource_id: 'resource-123',
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0',
      };

      const auditLog = { id: 'audit-123', ...auditData };
      mockRepository.create.mockReturnValue(auditLog);
      mockRepository.save.mockResolvedValue(auditLog);

      await service.logAction(auditData);

      expect(mockRepository.create).toHaveBeenCalledWith(auditData);
      expect(mockRepository.save).toHaveBeenCalledWith(auditLog);
    });

    it('should not throw error when save fails', async () => {
      const auditData = {
        tenant_id: 'tenant-123',
        action: 'user.created',
        resource_type: 'user',
      };

      mockRepository.create.mockReturnValue(auditData);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.logAction(auditData)).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const query: AuditQueryDto = {
        page: 1,
        limit: 10,
        sort: 'created_at',
        order: 'DESC',
      };
      const tenantId = 'tenant-123';

      const mockLogs = [
        { id: '1', action: 'user.created' },
        { id: '2', action: 'user.updated' },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockLogs, 2]);

      const result = await service.getAuditLogs(query, tenantId);

      expect(result).toEqual({
        items: mockLogs,
        total: 2,
        page: 1,
        limit: 10,
        pages: 1,
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'audit_log.tenant_id = :tenantId',
        { tenantId },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'audit_log.created_at',
        'DESC',
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply filters when provided', async () => {
      const query: AuditQueryDto = {
        user_id: 'user-123',
        action: 'user.created',
        resource_type: 'user',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };
      const tenantId = 'tenant-123';

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs(query, tenantId);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.user_id = :userId',
        { userId: 'user-123' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.action = :action',
        { action: 'user.created' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.resource_type = :resourceType',
        { resourceType: 'user' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.created_at >= :startDate',
        { startDate: '2024-01-01' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.created_at <= :endDate',
        { endDate: '2024-12-31' },
      );
    });

    it('should handle invalid sort fields', async () => {
      const query: AuditQueryDto = {
        sort: 'invalid_field',
        order: 'ASC',
      };
      const tenantId = 'tenant-123';

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAuditLogs(query, tenantId);

      // Should default to created_at
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'audit_log.created_at',
        'ASC',
      );
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const userId = 'user-123';
      const tenantId = 'tenant-123';
      const limit = 5;

      const mockLogs = [
        { id: '1', action: 'auth.login' },
        { id: '2', action: 'user.updated' },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.getUserActivity(userId, tenantId, limit);

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: userId,
          tenant_id: tenantId,
        },
        order: {
          created_at: 'DESC',
        },
        take: limit,
      });
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const tenantId = 'tenant-123';
      const days = 7;

      const mockStats = [
        { action: 'user.created', count: '10' },
        { action: 'auth.login', count: '50' },
      ];

      mockQueryBuilder.getRawMany.mockResolvedValue(mockStats);

      const result = await service.getAuditStats(tenantId, days);

      expect(result).toEqual(mockStats);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'audit_log.tenant_id = :tenantId',
        { tenantId },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'audit_log.created_at >= :startDate',
        expect.objectContaining({
          startDate: expect.any(Date),
        }),
      );
    });
  });

  describe('exportAuditLogsAsCsv', () => {
    it('should export audit logs as CSV', async () => {
      const query: AuditQueryDto = {};
      const tenantId = 'tenant-123';

      const mockLogs = [
        {
          created_at: new Date('2024-01-01T10:00:00Z'),
          user: { email: 'test@example.com' },
          action: 'user.created',
          resource_type: 'user',
          resource_id: 'user-456',
          ip_address: '127.0.0.1',
          details: { name: 'Test User' },
        },
        {
          created_at: new Date('2024-01-02T15:30:00Z'),
          user: null,
          action: 'system.startup',
          resource_type: 'system',
          resource_id: null,
          ip_address: null,
          details: null,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLogsAsCsv(query, tenantId);

      expect(result).toBeInstanceOf(Buffer);
      const csv = result.toString('utf-8');
      
      // Check CSV headers
      expect(csv).toContain('Date,Time,User,Action,Resource Type,Resource ID,IP Address,Details');
      
      // Check data rows
      expect(csv).toContain('test@example.com');
      expect(csv).toContain('user.created');
      expect(csv).toContain('127.0.0.1');
      expect(csv).toContain('System');
      expect(csv).toContain('system.startup');
    });

    it('should escape special characters in CSV', async () => {
      const query: AuditQueryDto = {};
      const tenantId = 'tenant-123';

      const mockLogs = [
        {
          created_at: new Date(),
          user: { email: 'test@example.com' },
          action: 'user.created',
          resource_type: 'user',
          resource_id: 'id-with,comma',
          ip_address: '127.0.0.1',
          details: { description: 'User with "quotes" and\nnewline' },
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockLogs);

      const result = await service.exportAuditLogsAsCsv(query, tenantId);
      const csv = result.toString('utf-8');

      // Check proper escaping
      expect(csv).toContain('"id-with,comma"');
      // The details field is JSON stringified and then CSV escaped
      expect(csv).toContain('127.0.0.1');
      expect(csv).toContain('user.created');
    });
  });
});