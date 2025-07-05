import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { NoImpersonationGuard } from './no-impersonation.guard';

describe('NoImpersonationGuard', () => {
  let guard: NoImpersonationGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new NoImpersonationGuard(reflector);
  });

  const createMockExecutionContext = (user: any = null): ExecutionContext => {
    const mockRequest = { user };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
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
      const context = createMockExecutionContext(null);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should return true when user is not impersonating', () => {
      const user = { id: '123', email: 'user@example.com' };
      const context = createMockExecutionContext(user);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when is_impersonating is false', () => {
      const user = { id: '123', impersonation: { is_impersonating: false } };
      const context = createMockExecutionContext(user);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is impersonating', () => {
      const user = {
        id: '123',
        email: 'target@example.com',
        impersonation: {
          is_impersonating: true,
          impersonator_id: '456',
          impersonator_email: 'admin@example.com',
        },
      };
      const context = createMockExecutionContext(user);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'This action is not allowed while impersonating another user',
      );
    });
  });
});
