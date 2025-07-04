import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (
    user: any = null,
    requiredRoles: UserRole[] | null = null
  ): ExecutionContext => {
    const mockRequest = { user };
    const mockHandler = {};
    const mockClass = {};
    
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

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
    it('should return true when no roles are required', () => {
      const context = createMockExecutionContext();
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(true);
    });

    it('should return false when user is not present', () => {
      const context = createMockExecutionContext(null, [UserRole.WERKPLAATS]);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(false);
    });

    it('should return true for super admin regardless of required roles', () => {
      const user = { role: UserRole.SUPER_ADMIN };
      const context = createMockExecutionContext(user, [UserRole.WERKPLAATS]);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      const user = { role: UserRole.WERKPLAATS };
      const context = createMockExecutionContext(user, [UserRole.WERKPLAATS]);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      const user = { role: UserRole.WASSERS };
      const context = createMockExecutionContext(user, [
        UserRole.WERKPLAATS,
        UserRole.WASSERS,
        UserRole.WASPLANNERS,
      ]);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      const user = { role: UserRole.WERKPLAATS };
      const context = createMockExecutionContext(user, [UserRole.GARAGE_ADMIN]);
      
      const result = guard.canActivate(context);
      
      expect(result).toBe(false);
    });

    it('should check metadata keys in correct order', () => {
      const user = { role: UserRole.WERKPLAATS };
      const context = createMockExecutionContext(user, [UserRole.WERKPLAATS]);
      
      guard.canActivate(context);
      
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });
});