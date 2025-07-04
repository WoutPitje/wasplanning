import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;
  let authService: AuthService;

  const mockUser = {
    id: 'user-uuid',
    email: 'user@test-garage.nl',
    password: 'hashedpassword',
    first_name: 'Jan',
    last_name: 'de Vries',
    role: UserRole.WASSERS,
    is_active: true,
    tenant_id: 'tenant-uuid',
    created_at: new Date(),
    updated_at: new Date(),
    tenant: {
      id: 'tenant-uuid',
      name: 'test-garage',
      display_name: 'Test Garage',
    },
  };

  const mockCurrentUser = {
    id: 'current-user-uuid',
    email: 'admin@test-garage.nl',
    role: UserRole.GARAGE_ADMIN,
    first_name: 'Current',
    last_name: 'User',
    tenant: {
      id: 'tenant-uuid',
      name: 'test-garage',
      display_name: 'Test Garage',
    },
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAuthService = {
    createUser: jest.fn(),
    hashPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
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

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@test-garage.nl',
      first_name: 'Piet',
      last_name: 'Bakker',
      role: UserRole.WASSERS,
      tenant_id: 'tenant-uuid',
    };

    it('should create a user with provided password', async () => {
      const dtoWithPassword = { ...createUserDto, password: 'mypassword123' };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockAuthService.createUser.mockResolvedValue(mockUser);

      const result = await service.create(dtoWithPassword);

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('temporary_password');
      expect(mockAuthService.createUser).toHaveBeenCalledWith(dtoWithPassword);
    });

    it('should create a user with generated password', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockAuthService.createUser.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).not.toHaveProperty('password');
      expect(result).toHaveProperty('temporary_password');
      expect(result.temporary_password).toHaveLength(12);
      expect(mockAuthService.createUser).toHaveBeenCalledWith({
        ...createUserDto,
        password: expect.any(String),
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        `User with email ${createUserDto.email} already exists`
      );
    });
  });

  describe('findAll', () => {
    it('should return all users for super admin', async () => {
      const users = [mockUser, { ...mockUser, id: 'user-2' }];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(users),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });

    it('should return only tenant users for garage admin', async () => {
      const users = [mockUser];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(users),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.findAll('tenant-uuid');

      expect(result).toEqual(users);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'user.tenant_id = :tenantId',
        { tenantId: 'tenant-uuid' }
      );
    });
  });

  describe('findOne', () => {
    it('should return user without password', async () => {
      mockUserRepository.findOne.mockResolvedValue({ ...mockUser });

      const result = await service.findOne(mockUser.id, mockCurrentUser);

      expect(result).not.toHaveProperty('password');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        relations: ['tenant'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('invalid-id', mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for cross-tenant access', async () => {
      const otherTenantUser = { ...mockUser, tenant_id: 'other-tenant' };
      mockUserRepository.findOne.mockResolvedValue(otherTenantUser);

      await expect(
        service.findOne(mockUser.id, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow super admin to access any user', async () => {
      const otherTenantUser = { ...mockUser, tenant_id: 'other-tenant' };
      mockUserRepository.findOne.mockResolvedValue(otherTenantUser);
      const superAdmin = { ...mockCurrentUser, role: UserRole.SUPER_ADMIN };

      const result = await service.findOne(mockUser.id, superAdmin);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
    });
  });

  describe('update', () => {
    const updateUserDto = {
      first_name: 'Updated',
      last_name: 'Name',
      is_active: false,
    };

    it('should update user', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, ...updateUserDto });
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockUser.id, updateUserDto, mockCurrentUser);

      expect(result).toMatchObject(updateUserDto);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        updateUserDto
      );
    });

    it('should prevent non-super admin from changing roles', async () => {
      const dtoWithRole = { ...updateUserDto, role: UserRole.GARAGE_ADMIN };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.update(mockUser.id, dtoWithRole, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(mockUser.id, dtoWithRole, mockCurrentUser)
      ).rejects.toThrow('Only super admin can change user roles');
    });

    it('should allow super admin to change roles', async () => {
      const dtoWithRole = { ...updateUserDto, role: UserRole.GARAGE_ADMIN };
      const superAdmin = { ...mockCurrentUser, role: UserRole.SUPER_ADMIN };
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ ...mockUser, ...dtoWithRole });
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(mockUser.id, dtoWithRole, superAdmin);

      expect(result.role).toBe(UserRole.GARAGE_ADMIN);
    });

  });

  describe('resetPassword', () => {
    const newPassword = 'newSecurePassword123';

    it('should reset user password', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockAuthService.hashPassword.mockResolvedValue('newHashedPassword');
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.resetPassword(
        mockUser.id,
        newPassword,
        mockCurrentUser
      );

      expect(result).toEqual({ message: 'Password reset successfully' });
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith(newPassword);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        password: 'newHashedPassword',
      });
    });

    it('should throw ForbiddenException for cross-tenant password reset', async () => {
      const otherTenantUser = { ...mockUser, tenant_id: 'other-tenant' };
      mockUserRepository.findOne.mockResolvedValue(otherTenantUser);

      await expect(
        service.resetPassword(mockUser.id, newPassword, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should deactivate user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.remove(mockUser.id, mockCurrentUser);

      expect(result).toEqual({
        message: `User ${mockUser.email} has been deactivated`,
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        is_active: false,
      });
    });

    it('should prevent user from deactivating themselves', async () => {
      const selfUser = { ...mockUser, id: mockCurrentUser.id };
      mockUserRepository.findOne.mockResolvedValue(selfUser);

      await expect(
        service.remove(selfUser.id, mockCurrentUser)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove(selfUser.id, mockCurrentUser)
      ).rejects.toThrow('Cannot deactivate your own account');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('invalid-id', mockCurrentUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate a 12-character password', () => {
      const password = (service as any).generateTemporaryPassword();
      
      expect(password).toHaveLength(12);
      expect(password).toMatch(/^[A-HJ-NP-Za-hj-np-z2-9!@#$%]+$/);
    });
  });
});