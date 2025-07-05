import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from '../auth/entities/tenant.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantRepository: Repository<Tenant>;
  let userRepository: Repository<User>;
  let authService: AuthService;

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
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
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

    it('should create a new tenant with admin user', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(null);
      mockTenantRepository.create.mockReturnValue(mockTenant);
      mockTenantRepository.save.mockResolvedValue(mockTenant);
      mockAuthService.createUser.mockResolvedValue(mockUser);

      const result = await service.create(createTenantDto);

      expect(result).toHaveProperty('tenant');
      expect(result).toHaveProperty('admin_user');
      expect(result).toHaveProperty('instructions');
      expect(result.admin_user).toHaveProperty('temporary_password');
      expect(result.admin_user.temporary_password).toHaveLength(12);

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
        ConflictException
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `Tenant with name ${createTenantDto.name} already exists`
      );
    });

    it('should throw ConflictException if admin email already exists', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createTenantDto)).rejects.toThrow(
        `User with email ${createTenantDto.admin_email} already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const tenants = [mockTenant, { ...mockTenant, id: 'tenant-2', name: 'garage-2' }];
      mockTenantRepository.find.mockResolvedValue(tenants);

      const result = await service.findAll();

      expect(result).toEqual(tenants);
      expect(mockTenantRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name', 'display_name', 'logo_url', 'language', 'is_active', 'created_at', 'updated_at'],
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
        relations: ['users'],
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException
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
        updateTenantDto
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updateTenantDto)
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
      expect(mockTenantRepository.update).toHaveBeenCalledWith(
        mockTenant.id,
        { is_active: false }
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getStats', () => {
    it('should return tenant statistics', async () => {
      const tenantWithUsers = {
        ...mockTenant,
        users: [
          { ...mockUser, role: UserRole.GARAGE_ADMIN },
          { ...mockUser, id: 'user-2', role: UserRole.WASSERS },
          { ...mockUser, id: 'user-3', role: UserRole.WASSERS, is_active: false },
        ],
      };
      mockTenantRepository.findOne.mockResolvedValue(tenantWithUsers);

      const result = await service.getStats(mockTenant.id);

      expect(result).toEqual({
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
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockTenantRepository.findOne.mockResolvedValue(null);

      await expect(service.getStats('invalid-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate a 12-character password', () => {
      // Access private method through instance
      const password = (service as any).generateTemporaryPassword();
      
      expect(password).toHaveLength(12);
      expect(password).toMatch(/^[A-HJ-NP-Za-hj-kmnp-z2-9!@#$%]+$/);
    });
  });
});