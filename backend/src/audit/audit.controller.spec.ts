import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { UserRole } from '../auth/entities/user.entity';
import { StreamableFile } from '@nestjs/common';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    getAuditLogs: jest.fn(),
    getAuditStats: jest.fn(),
    getUserActivity: jest.fn(),
    exportAuditLogsAsCsv: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'admin@example.com',
      role: UserRole.SUPER_ADMIN,
      tenant: {
        id: 'tenant-123',
        name: 'Test Garage',
      },
    },
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  };

  const mockResponse = {
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const query: AuditQueryDto = {
        page: 1,
        limit: 20,
      };

      const mockResult = {
        items: [
          { id: '1', action: 'user.created' },
          { id: '2', action: 'auth.login' },
        ],
        total: 2,
        page: 1,
        limit: 20,
        pages: 1,
      };

      mockAuditService.getAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(query, mockRequest);

      expect(result).toEqual(mockResult);
      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
        query,
        'tenant-123',
      );
    });

    it('should pass filters to service', async () => {
      const query: AuditQueryDto = {
        page: 2,
        limit: 10,
        user_id: 'user-456',
        action: 'user.updated',
        resource_type: 'user',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        sort: 'action',
        order: 'ASC',
      };

      mockAuditService.getAuditLogs.mockResolvedValue({
        items: [],
        total: 0,
        page: 2,
        limit: 10,
        pages: 0,
      });

      await controller.getAuditLogs(query, mockRequest);

      expect(mockAuditService.getAuditLogs).toHaveBeenCalledWith(
        query,
        'tenant-123',
      );
    });
  });

  describe('getAuditStats', () => {
    it('should return audit statistics', async () => {
      const mockStats = [
        { action: 'auth.login', count: 50 },
        { action: 'user.created', count: 10 },
        { action: 'user.updated', count: 25 },
      ];

      mockAuditService.getAuditStats.mockResolvedValue(mockStats);

      const result = await controller.getAuditStats(mockRequest);

      expect(result).toEqual(mockStats);
      expect(mockAuditService.getAuditStats).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const userId = 'user-456';
      const mockActivity = [
        { id: '1', action: 'auth.login', created_at: new Date() },
        { id: '2', action: 'user.updated', created_at: new Date() },
      ];

      mockAuditService.getUserActivity.mockResolvedValue(mockActivity);

      const result = await controller.getUserActivity(userId, mockRequest);

      expect(result).toEqual(mockActivity);
      expect(mockAuditService.getUserActivity).toHaveBeenCalledWith(
        userId,
        'tenant-123',
      );
    });

    it('should validate UUID format', async () => {
      // The ParseUUIDPipe would throw an error for invalid UUIDs
      // This is handled by NestJS framework, but we can test the service call
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      
      mockAuditService.getUserActivity.mockResolvedValue([]);

      await controller.getUserActivity(validUuid, mockRequest);

      expect(mockAuditService.getUserActivity).toHaveBeenCalledWith(
        validUuid,
        'tenant-123',
      );
    });
  });

  describe('exportAuditLogs', () => {
    it('should export audit logs as CSV', async () => {
      const query: AuditQueryDto = {
        user_id: 'user-123',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      };

      const mockCsvContent = Buffer.from('Date,Time,User,Action\n2024-01-01,10:00:00,test@example.com,user.created');
      mockAuditService.exportAuditLogsAsCsv.mockResolvedValue(mockCsvContent);

      const result = await controller.exportAuditLogs(query, mockRequest, mockResponse);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(mockAuditService.exportAuditLogsAsCsv).toHaveBeenCalledWith(
        query,
        'tenant-123',
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': expect.stringContaining('attachment; filename="audit-logs-'),
      });
    });

    it('should generate filename with current date', async () => {
      const query: AuditQueryDto = {};
      const mockCsvContent = Buffer.from('test');
      mockAuditService.exportAuditLogsAsCsv.mockResolvedValue(mockCsvContent);

      await controller.exportAuditLogs(query, mockRequest, mockResponse);

      const dateString = new Date().toISOString().split('T')[0];
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${dateString}.csv"`,
      });
    });
  });

  describe('Role-based access', () => {
    it('should allow super admin access', async () => {
      const query: AuditQueryDto = {};
      mockAuditService.getAuditLogs.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      });

      const superAdminRequest = {
        ...mockRequest,
        user: {
          ...mockRequest.user,
          role: UserRole.SUPER_ADMIN,
        },
      };

      await expect(
        controller.getAuditLogs(query, superAdminRequest),
      ).resolves.not.toThrow();
    });

    it('should allow garage admin access', async () => {
      const query: AuditQueryDto = {};
      mockAuditService.getAuditLogs.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
      });

      const garageAdminRequest = {
        ...mockRequest,
        user: {
          ...mockRequest.user,
          role: UserRole.GARAGE_ADMIN,
        },
      };

      await expect(
        controller.getAuditLogs(query, garageAdminRequest),
      ).resolves.not.toThrow();
    });

    // Note: The actual role checking is done by guards, which would be tested in integration/e2e tests
  });
});