import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from '../auth/entities/tenant.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { StorageService } from '../storage/storage.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UsageRecord } from '../subscriptions/entities/usage-record.entity';
import { AuditService } from '../audit/audit.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let subscriptionRepository: Repository<Subscription>;
  let subscriptionPlanRepository: Repository<SubscriptionPlan>;
  let authService: AuthService;
  let auditService: AuditService;

  const mockTenant = {
    id: 'tenant-uuid',
    name: 'test-garage',
    display_name: 'Test Garage',
    logo_url: '',
    settings: {},
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    users: [],
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'admin@test-garage.nl',
    password: 'hashedpassword',
    first_name: 'Jan',
    last_name: 'de Vries',
    role: UserRole.GARAGE_ADMIN,
    is_active: true,
    tenant_id: 'tenant-uuid',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockAuthService = {
    createUser: jest.fn(),
  };

  const mockSubscriptionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSubscriptionPlanRepository = {
    findOne: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  const mockFreePlan = {
    id: 'free-plan-id',
    name: 'free',
    display_name: 'Gratis',
    price_cents: 0,
    max_cars_per_month: 50,
    max_active_users: 2,
    max_locations: 1,
  };

  const mockUsageRecordRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: mockSubscriptionPlanRepository,
        },
        {
          provide: getRepositoryToken(UsageRecord),
          useValue: mockUsageRecordRepository,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
            generatePresignedUrl: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    subscriptionPlanRepository = module.get<Repository<SubscriptionPlan>>(
      getRepositoryToken(SubscriptionPlan),
    );
    authService = module.get<AuthService>(AuthService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTenantDto = {
      name: 'new-garage',
      display_name: 'New Garage',
      logo_url: 'https://example.com/logo.png',
      language: 'nl',
      admin_email: 'admin@new-garage.nl',
      admin_first_name: 'Piet',
      admin_last_name: 'Bakker',
    };

    it('should create a new tenant with admin user and subscription', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockReturnValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue(mockTenant);
      mockAuthService.createUser.mockResolvedValue(mockUser);
      mockSubscriptionPlanRepository.findOne.mockResolvedValue(mockFreePlan);

      const mockSubscription = {
        id: 'subscription-id',
        tenant_id: mockTenant.id,
        plan_id: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
      };
      mockSubscriptionRepository.create.mockReturnValue(mockSubscription);
      mockSubscriptionRepository.save.mockResolvedValue(mockSubscription);

      const result = await service.create(createTenantDto);

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('admin_user');
      expect(result).toHaveProperty('instructions');
      expect(result.admin_user).toHaveProperty('temporary_password');
      expect(result.admin_user.temporary_password).toHaveLength(12);

      // Verify subscription was created
      expect(mockSubscriptionPlanRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'free' },
      });
      expect(mockSubscriptionRepository.create).toHaveBeenCalledWith({
        tenant_id: mockTenant.id,
        plan_id: mockFreePlan.id,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: expect.any(Date),
        current_period_end: expect.any(Date),
      });
      expect(mockSubscriptionRepository.save).toHaveBeenCalledWith(
        mockSubscription,
      );

      // Verify audit log was created
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        tenant_id: mockTenant.id,
        user_id: null,
        action: 'subscription.created',
        resource_type: 'subscription',
        resource_id: mockSubscription.id,
        details: {
          plan_name: 'free',
          auto_assigned: true,
          reason: 'New tenant creation',
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      expect(mockTenantRepository.findOne).toHaveBeenCalledWith({
        where: { name: createTenantDto.name },
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createTenantDto.admin_email },
      });
      expect(mockAuthService.createUser).toHaveBeenCalledWith({
        email: createTenantDto.admin_email,
        password: expect.any(String),
        first_name: createTenantDto.admin_first_name,
        last_name: createTenantDto.admin_last_name,
        role: UserRole.GARAGE_ADMIN,
        tenant_id: mockTenant.id,
      });
    });

    it('should throw ConflictException if tenant name already exists', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `Tenant with name ${createTenantDto.name} already exists`,
      );
    });

    it('should throw ConflictException if admin email already exists', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `User with email ${createTenantDto.admin_email} already exists`,
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const tenants = [
        mockTenant,
        { ...mockTenant, id: 'tenant-2', name: 'garage-2' },
      ];
      mockTenantRepository.find.mockResolvedValue(tenants);

      const result = await service.findAll();

      // The result includes subscription data which is null for these mocked tenants
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: mockTenant.id,
        name: mockTenant.name,
        display_name: mockTenant.display_name,
        subscription: null,
      });
      expect(mockTenantRepository.find).toHaveBeenCalledWith({
        select: [
          'id',
          'name',
          'display_name',
          'logo_url',
          'language',
          'is_active',
          'created_at',
          'updated_at',
        ],
        relations: ['subscription', 'subscription.plan'],
        order: { created_at: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return tenant with users', async () => {
      const tenantWithUsers = {
        ...mockTenant,
        users: [{ ...mockUser, password: 'hashedpassword' }],
      };
      mockTenantRepository.findOne.mockResolvedValue(tenantWithUsers);

      const result = await service.findOne(mockTenant.id);

      expect(result.users[0]).not.toHaveProperty('password');
      expect(mockTenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
        relations: ['users', 'subscription', 'subscription.plan'],
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateTenantDto = {
      display_name: 'Updated Garage',
      is_active: false,
    };

    it('should update tenant', async () => {
      mockTenantRepository.findOne
        .mockResolvedValueOnce(mockTenant)
        .mockResolvedValueOnce({ ...mockTenant, ...updateTenantDto });
      mockTenantRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockTenant.id, updateTenantDto);

      expect(result).toMatchObject(updateTenantDto);
      expect(mockTenantRepository.update).toHaveBeenCalledWith(
        mockTenant.id,
        updateTenantDto,
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateTenantDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should deactivate tenant', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mockTenant.id);

      expect(result).toEqual({
        message: `Tenant ${mockTenant.name} has been deactivated`,
      });
      expect(mockTenantRepository.update).toHaveBeenCalledWith(mockTenant.id, {
        is_active: false,
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStats', () => {
    it('should return tenant statistics', async () => {
      const mockSubscriptionWithPlan = {
        id: 'subscription-id',
        tenant_id: mockTenant.id,
        plan_id: mockFreePlan.id,
        plan: mockFreePlan,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: new Date('2025-01-01'),
        current_period_end: new Date('2025-01-31'),
      };

      const tenantWithUsers = {
        ...mockTenant,
        subscription: mockSubscriptionWithPlan,
        users: [
          { ...mockUser, role: UserRole.GARAGE_ADMIN },
          { ...mockUser, id: 'user-2', role: UserRole.WASSERS },
          {
            ...mockUser,
            id: 'user-3',
            role: UserRole.WASSERS,
            is_active: false,
          },
        ],
      };
      mockTenantRepository.findOne.mockResolvedValue(tenantWithUsers);
      mockUsageRecordRepository.find.mockResolvedValue([]);

      const result = await service.getStats(mockTenant.id);

      expect(result).toMatchObject({
        tenant_id: mockTenant.id,
        tenant_name: mockTenant.name,
        total_users: 3,
        active_users: 2,
        users_by_role: {
          [UserRole.GARAGE_ADMIN]: 1,
          [UserRole.WASSERS]: 2,
        },
        created_at: mockTenant.created_at,
        last_updated: mockTenant.updated_at,
        subscription: {
          plan_name: 'free',
          plan_display_name: 'Gratis',
          status: SubscriptionStatus.ACTIVE,
          current_period_end: mockSubscriptionWithPlan.current_period_end,
          usage: {
            cars_washed: 0,
            active_users: 2,
            locations: 1,
          },
          limits: {
            max_cars_per_month: 50,
            max_active_users: 2,
            max_locations: 1,
          },
        },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getStats('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate a 12-character password', () => {
      // Access private method through instance
      const password = (service as any).generateTemporaryPassword();

      expect(password).toHaveLength(12);
      // Updated regex to match the actual character set used in generateTemporaryPassword
      expect(password).toMatch(
        /^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%]+$/,
      );
    });
  });
});
