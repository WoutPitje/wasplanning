import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { UserRole } from '../entities/user.entity';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  const createMockExecutionContext = (
    user: any = null,
    tenantId: string | null = null,
  ): ExecutionContext => {
    const mockRequest = {
      user,
      params: tenantId ? { tenantId } : {},
    };
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
    } as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return false when user is not present', () => {
      const context = createMockExecutionContext();

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return true for super admin regardless of tenant', () => {
      const user = {
        role: UserRole.SUPER_ADMIN,
        tenant: { id: 'tenant-1', name: 'garage-1' },
      };
      const context = createMockExecutionContext(user, 'tenant-2');

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when no tenant parameter is present', () => {
      const user = {
        role: UserRole.WERKPLAATS,
        tenant: { id: 'tenant-1', name: 'garage-1' },
      };
      const context = createMockExecutionContext(user);

      const result = guard.canActivate(context);

      expect(result).toBe(true);

      const request = context.switchToHttp().getRequest();
      expect(request.tenantId).toBe('tenant-1');
      expect(request.tenantName).toBe('garage-1');
    });

    it('should return true when tenant parameter matches user tenant', () => {
      const user = {
        role: UserRole.WERKPLAATS,
        tenant: { id: 'tenant-1', name: 'garage-1' },
      };
      const context = createMockExecutionContext(user, 'tenant-1');

      const result = guard.canActivate(context);

      expect(result).toBe(true);

      const request = context.switchToHttp().getRequest();
      expect(request.tenantId).toBe('tenant-1');
      expect(request.tenantName).toBe('garage-1');
    });

    it('should throw ForbiddenException when tenant parameter does not match user tenant', () => {
      const user = {
        role: UserRole.WERKPLAATS,
        tenant: { id: 'tenant-1', name: 'garage-1' },
      };
      const context = createMockExecutionContext(user, 'tenant-2');

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied to this tenant',
      );
    });

    it('should add tenant context to request', () => {
      const user = {
        role: UserRole.GARAGE_ADMIN,
        tenant: { id: 'tenant-1', name: 'garage-1' },
      };
      const context = createMockExecutionContext(user);

      guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.tenantId).toBe('tenant-1');
      expect(request.tenantName).toBe('garage-1');
    });

    it('should handle different user roles with tenant validation', () => {
      const roles = [
        UserRole.WERKPLAATS,
        UserRole.WASSERS,
        UserRole.HAAL_BRENG_PLANNERS,
        UserRole.WASPLANNERS,
        UserRole.GARAGE_ADMIN,
      ];

      roles.forEach((role) => {
        const user = {
          role,
          tenant: { id: 'tenant-1', name: 'garage-1' },
        };
        const context = createMockExecutionContext(user, 'tenant-1');

        const result = guard.canActivate(context);

        expect(result).toBe(true);
      });
    });
  });
});
