import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from './entities/tenant.entity';
import { UnauthorizedException } from '@nestjs/common';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tenantRepository: Repository<Tenant>;
  let jwtService: JwtService;

  const mockTenant = {
    id: 'tenant-uuid',
    name: 'test-garage',
    display_name: 'Test Garage',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedpassword',
    first_name: 'John',
    last_name: 'Doe',
    role: UserRole.WERKPLAATS,
    is_active: true,
    tenant_id: 'tenant-uuid',
    tenant: mockTenant,
    last_login: undefined as any,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tenantRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'testpassword';
      
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email, is_active: true },
        relations: ['tenant'],
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        { last_login: expect.any(Date) }
      );
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'testpassword';
      
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should return null when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      const bcrypt = require('bcrypt');
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should return null when user is inactive', async () => {
      const email = 'test@example.com';
      const password = 'testpassword';
      
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return auth response with tokens and user data', async () => {
      const accessToken = 'access-token';
      const refreshToken = 'refresh-token';
      
      mockJwtService.sign
        .mockReturnValueOnce(accessToken)
        .mockReturnValueOnce(refreshToken);

      const result = await service.login(mockUser as User);

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name,
          tenant: {
            id: mockUser.tenant.id,
            name: mockUser.tenant.name,
            display_name: mockUser.tenant.display_name,
          },
        },
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tenant: {
          id: mockUser.tenant.id,
          name: mockUser.tenant.name,
          display_name: mockUser.tenant.display_name,
        },
      });
    });
  });

  describe('refreshToken', () => {
    it('should return new auth response for valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const newAccessToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';
      
      mockJwtService.verify.mockReturnValue({ id: mockUser.id });
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign
        .mockReturnValueOnce(newAccessToken)
        .mockReturnValueOnce(newRefreshToken);

      const result = await service.refreshToken(refreshToken);

      expect(result.access_token).toBe(newAccessToken);
      expect(result.refresh_token).toBe(newRefreshToken);
      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';
      
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const refreshToken = 'valid-refresh-token';
      
      mockJwtService.verify.mockReturnValue({ id: 'nonexistent-id' });
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testpassword';
      const hashedPassword = 'hashedpassword';
      
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'testpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        role: UserRole.WASSERS,
        tenant_id: 'tenant-uuid',
      };
      
      const hashedPassword = 'hashedpassword';
      const createdUser = { ...mockUser, ...userData, password: hashedPassword };
      
      const bcrypt = require('bcrypt');
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.create.mockReturnValue(createdUser);
      mockUserRepository.save.mockResolvedValue(createdUser);

      const result = await service.createUser(userData);

      expect(result).toEqual(createdUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });
});