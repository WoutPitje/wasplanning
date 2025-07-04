import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { User, UserRole } from '../entities/user.entity';
import { JwtPayload } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: Repository<User>;
  let configService: ConfigService;

  const mockUser = {
    id: 'user-uuid',
    email: 'test@example.com',
    password: 'hashedpassword',
    first_name: 'John',
    last_name: 'Doe',
    role: UserRole.WERKPLAATS,
    is_active: true,
    tenant_id: 'tenant-uuid',
    tenant: {
      id: 'tenant-uuid',
      name: 'test-garage',
      display_name: 'Test Garage',
      is_active: true,
    },
  };

  const mockJwtPayload: JwtPayload = {
    sub: 'user-uuid',
    email: 'test@example.com',
    role: UserRole.WERKPLAATS,
    tenantId: 'tenant-uuid',
    tenantName: 'test-garage',
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    configService = module.get<ConfigService>(ConfigService);

    mockConfigService.get.mockReturnValue('test-jwt-secret');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user data when payload is valid', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockJwtPayload);

      expect(result).toEqual({
        sub: mockUser.id, // backward compatibility
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
        tenantId: mockUser.tenant.id, // backward compatibility
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockJwtPayload.sub, is_active: true },
        relations: ['tenant'],
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
        'User not found or inactive'
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when tenant is inactive', async () => {
      const userWithInactiveTenant = {
        ...mockUser,
        tenant: { ...mockUser.tenant, is_active: false },
      };
      mockUserRepository.findOne.mockResolvedValue(userWithInactiveTenant);

      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(mockJwtPayload)).rejects.toThrow(
        'Tenant is inactive'
      );
    });

    it('should validate different user roles', async () => {
      const roles = [
        UserRole.WERKPLAATS,
        UserRole.WASSERS,
        UserRole.HAAL_BRENG_PLANNERS,
        UserRole.WASPLANNERS,
        UserRole.GARAGE_ADMIN,
        UserRole.SUPER_ADMIN,
      ];

      for (const role of roles) {
        const userWithRole = { ...mockUser, role };
        const payloadWithRole = { ...mockJwtPayload, role };
        
        mockUserRepository.findOne.mockResolvedValue(userWithRole);

        const result = await strategy.validate(payloadWithRole);

        expect(result.role).toBe(role);
        jest.clearAllMocks();
      }
    });

    it('should include tenant context in returned user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockJwtPayload);

      expect(result.tenant).toEqual({
        id: mockUser.tenant.id,
        name: mockUser.tenant.name,
        display_name: mockUser.tenant.display_name,
      });
    });

    it('should use JWT secret from config service', () => {
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
    });
  });
});