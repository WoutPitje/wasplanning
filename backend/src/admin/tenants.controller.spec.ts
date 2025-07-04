import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UserRole } from '../auth/entities/user.entity';

describe('TenantsController', () => {
  let controller: TenantsController;

  const mockTenant = {
    id: 'tenant-uuid',
    name: 'test-garage',
    display_name: 'Test Garage',
    logo_url: '',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockCreateResponse = {
    tenant: mockTenant,
    admin_user: {
      id: 'user-uuid',
      email: 'admin@test-garage.nl',
      first_name: 'Jan',
      last_name: 'de Vries',
      temporary_password: 'TempPass123!',
    },
    instructions: 'Tenant created successfully.',
  };

  const mockStats = {
    tenant_id: 'tenant-uuid',
    tenant_name: 'test-garage',
    total_users: 5,
    active_users: 4,
    users_by_role: {
      [UserRole.GARAGE_ADMIN]: 1,
      [UserRole.WASSERS]: 2,
      [UserRole.WERKPLAATS]: 2,
    },
    created_at: new Date(),
    last_updated: new Date(),
  };

  const mockTenantsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      const createTenantDto: CreateTenantDto = {
        name: 'new-garage',
        display_name: 'New Garage',
        logo_url: 'https://example.com/logo.png',
        admin_email: 'admin@new-garage.nl',
        admin_first_name: 'Piet',
        admin_last_name: 'Bakker',
      };

      mockTenantsService.create.mockResolvedValue(mockCreateResponse);

      const result = await controller.create(createTenantDto);

      expect(result).toEqual(mockCreateResponse);
      expect(mockTenantsService.create).toHaveBeenCalledWith(createTenantDto);
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      const tenants = [mockTenant, { ...mockTenant, id: 'tenant-2', name: 'garage-2' }];
      mockTenantsService.findAll.mockResolvedValue(tenants);

      const result = await controller.findAll();

      expect(result).toEqual(tenants);
      expect(mockTenantsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single tenant', async () => {
      const tenantWithUsers = { ...mockTenant, users: [] };
      mockTenantsService.findOne.mockResolvedValue(tenantWithUsers);

      const result = await controller.findOne('tenant-uuid');

      expect(result).toEqual(tenantWithUsers);
      expect(mockTenantsService.findOne).toHaveBeenCalledWith('tenant-uuid');
    });
  });

  describe('getStats', () => {
    it('should return tenant statistics', async () => {
      mockTenantsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats('tenant-uuid');

      expect(result).toEqual(mockStats);
      expect(mockTenantsService.getStats).toHaveBeenCalledWith('tenant-uuid');
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const updateTenantDto: UpdateTenantDto = {
        display_name: 'Updated Garage',
        is_active: false,
      };
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      
      mockTenantsService.update.mockResolvedValue(updatedTenant);

      const result = await controller.update('tenant-uuid', updateTenantDto);

      expect(result).toEqual(updatedTenant);
      expect(mockTenantsService.update).toHaveBeenCalledWith('tenant-uuid', updateTenantDto);
    });
  });

  describe('remove', () => {
    it('should deactivate a tenant', async () => {
      const response = { message: 'Tenant test-garage has been deactivated' };
      mockTenantsService.remove.mockResolvedValue(response);

      const result = await controller.remove('tenant-uuid');

      expect(result).toEqual(response);
      expect(mockTenantsService.remove).toHaveBeenCalledWith('tenant-uuid');
    });
  });

  describe('Security', () => {
    it('should have correct decorators', () => {
      const guards = Reflect.getMetadata('__guards__', TenantsController);
      const roles = Reflect.getMetadata('roles', TenantsController);
      
      expect(guards).toBeDefined();
      expect(roles).toContain(UserRole.SUPER_ADMIN);
    });

    it('should have API documentation', () => {
      const apiTags = Reflect.getMetadata('swagger/apiUseTags', TenantsController);
      expect(apiTags).toEqual(['Admin - Tenants']);
    });
  });
});