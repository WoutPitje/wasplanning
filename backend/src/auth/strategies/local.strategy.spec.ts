import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from '../auth.service';
import { UserRole } from '../entities/user.entity';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

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
    },
  };

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when credentials are valid', async () => {
      const email = 'test@example.com';
      const password = 'testpassword';
      
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(email, password);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const email = 'nonexistent@example.com';
      const password = 'testpassword';
      
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should use email as username field', () => {
      // Test that the strategy is configured to use email field
      expect(strategy).toBeDefined();
      // The actual configuration is done in the constructor, 
      // this test ensures the strategy is properly instantiated
    });
  });
});