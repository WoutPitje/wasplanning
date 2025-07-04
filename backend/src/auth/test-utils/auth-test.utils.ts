import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { Tenant } from '../entities/tenant.entity';
import { JwtPayload } from '../auth.service';

export class AuthTestUtils {
  static createMockTenant(overrides: Partial<Tenant> = {}): Tenant {
    return {
      id: 'tenant-uuid',
      name: 'test-garage',
      display_name: 'Test Garage',
      logo_url: '',
      settings: {},
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      users: [],
      ...overrides,
    };
  }

  static createMockUser(overrides: Partial<User> = {}): User {
    const mockTenant = this.createMockTenant();
    return {
      id: 'user-uuid',
      email: 'test@example.com',
      password: 'hashedpassword',
      first_name: 'John',
      last_name: 'Doe',
      role: UserRole.WERKPLAATS,
      is_active: true,
      last_login: undefined as any,
      created_at: new Date(),
      updated_at: new Date(),
      tenant_id: mockTenant.id,
      tenant: mockTenant,
      ...overrides,
    };
  }

  static createMockJwtPayload(overrides: Partial<JwtPayload> = {}): JwtPayload {
    return {
      sub: 'user-uuid',
      email: 'test@example.com',
      role: UserRole.WERKPLAATS,
      tenantId: 'tenant-uuid',
      tenantName: 'test-garage',
      ...overrides,
    };
  }

  static async createHashedPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static createMockJwtService(): Partial<JwtService> {
    return {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ sub: 'user-uuid' }),
    };
  }

  static createMockUserRepository() {
    return {
      findOne: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
  }

  static createMockTenantRepository() {
    return {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
  }

  static createMockExecutionContext(
    user: any = null,
    params: any = {},
    requiredRoles: UserRole[] | null = null
  ) {
    const mockRequest = { user, params };
    const mockHandler = {};
    const mockClass = {};

    return {
      getHandler: () => mockHandler,
      getClass: () => mockClass,
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
    };
  }

  static createMockReflector(returnValue: any = null) {
    return {
      getAllAndOverride: jest.fn().mockReturnValue(returnValue),
      get: jest.fn(),
      getAll: jest.fn(),
    };
  }

  static createMockConfigService(jwtSecret = 'test-jwt-secret') {
    return {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'JWT_SECRET':
            return jwtSecret;
          case 'JWT_EXPIRES_IN':
            return '7d';
          case 'DATABASE_HOST':
            return 'localhost';
          case 'DATABASE_PORT':
            return 5432;
          default:
            return undefined;
        }
      }),
    };
  }

  static createUsersWithDifferentRoles(): User[] {
    const tenant = this.createMockTenant();
    const roles = [
      UserRole.WERKPLAATS,
      UserRole.WASSERS,
      UserRole.HAAL_BRENG_PLANNERS,
      UserRole.WASPLANNERS,
      UserRole.GARAGE_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    return roles.map((role, index) =>
      this.createMockUser({
        id: `user-${index}`,
        email: `${role}@example.com`,
        role,
        tenant,
        tenant_id: tenant.id,
      })
    );
  }

  static createMultipleTenants(): { tenants: Tenant[]; users: User[] } {
    const tenants = [
      this.createMockTenant({
        id: 'tenant-1',
        name: 'garage-1',
        display_name: 'Garage One',
      }),
      this.createMockTenant({
        id: 'tenant-2',
        name: 'garage-2',
        display_name: 'Garage Two',
      }),
    ];

    const users = tenants.map((tenant, index) =>
      this.createMockUser({
        id: `user-${index}`,
        email: `user${index}@${tenant.name}.com`,
        tenant,
        tenant_id: tenant.id,
      })
    );

    return { tenants, users };
  }

  static expectUserToMatchProfile(user: User, profile: any) {
    expect(profile).toEqual({
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        display_name: user.tenant.display_name,
      },
    });
  }

  static expectAuthResponseStructure(authResponse: any) {
    expect(authResponse).toHaveProperty('access_token');
    expect(authResponse).toHaveProperty('refresh_token');
    expect(authResponse).toHaveProperty('user');
    expect(authResponse.user).toHaveProperty('id');
    expect(authResponse.user).toHaveProperty('email');
    expect(authResponse.user).toHaveProperty('role');
    expect(authResponse.user).toHaveProperty('tenant');
    expect(authResponse.user.tenant).toHaveProperty('id');
    expect(authResponse.user.tenant).toHaveProperty('name');
  }
}