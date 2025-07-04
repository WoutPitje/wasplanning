import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRole } from '../auth/entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    resetPassword: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-id',
      email: 'admin@test.com',
      role: UserRole.GARAGE_ADMIN,
      first_name: 'Admin',
      last_name: 'User',
      tenant: {
        id: 'tenant-id',
        name: 'test-tenant',
        display_name: 'Test Tenant',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@test.com',
      first_name: 'New',
      last_name: 'User',
      role: UserRole.WASSERS,
      tenant_id: 'tenant-id',
    };

    it('should create a user', async () => {
      const expectedResult = { id: 'new-user-id', ...createUserDto };
      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createUserDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ForbiddenException when garage admin tries to create user in another tenant', async () => {
      const crossTenantDto = { ...createUserDto, tenant_id: 'other-tenant-id' };

      await expect(
        controller.create(crossTenantDto, mockRequest)
      ).rejects.toThrow(ForbiddenException);
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should allow super admin to create user in any tenant', async () => {
      const superAdminRequest = {
        user: { ...mockRequest.user, role: UserRole.SUPER_ADMIN },
      };
      const crossTenantDto = { ...createUserDto, tenant_id: 'other-tenant-id' };
      const expectedResult = { id: 'new-user-id', ...crossTenantDto };
      mockUsersService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(crossTenantDto, superAdminRequest);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.create).toHaveBeenCalledWith(crossTenantDto);
    });
  });

  describe('findAll', () => {
    it('should return users filtered by tenant for garage admin', async () => {
      const users = [{ id: 'user1' }, { id: 'user2' }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalledWith('tenant-id');
    });

    it('should return all users for super admin', async () => {
      const superAdminRequest = {
        user: { ...mockRequest.user, role: UserRole.SUPER_ADMIN },
      };
      const users = [{ id: 'user1' }, { id: 'user2' }];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll(superAdminRequest);

      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalledWith(undefined);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const user = { id: 'user-id', email: 'user@test.com' };
      mockUsersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne('user-id', mockRequest);

      expect(result).toEqual(user);
      expect(mockUsersService.findOne).toHaveBeenCalledWith('user-id', mockRequest.user);
    });
  });

  describe('update', () => {
    const updateUserDto = {
      first_name: 'Updated',
      last_name: 'Name',
    };

    it('should update a user', async () => {
      const updatedUser = { id: 'user-id', ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('user-id', updateUserDto, mockRequest);

      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        'user-id',
        updateUserDto,
        mockRequest.user
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const resetPasswordDto = { new_password: 'NewPassword123!' };
      const expectedResult = { message: 'Password reset successfully' };
      mockUsersService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(
        'user-id',
        resetPasswordDto,
        mockRequest
      );

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.resetPassword).toHaveBeenCalledWith(
        'user-id',
        resetPasswordDto.new_password,
        mockRequest.user
      );
    });
  });

  describe('remove', () => {
    it('should deactivate a user', async () => {
      const expectedResult = { message: 'User deactivated' };
      mockUsersService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('user-id', mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockUsersService.remove).toHaveBeenCalledWith('user-id', mockRequest.user);
    });
  });
});