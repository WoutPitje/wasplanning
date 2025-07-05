import { UseGuards } from '@nestjs/common';
import { NoImpersonationGuard } from '../guards/no-impersonation.guard';

/**
 * Decorator that prevents access to an endpoint while impersonating another user.
 * Use this on sensitive operations like password changes, user deletion, etc.
 *
 * @example
 * ```typescript
 * @NoImpersonation()
 * @Put('change-password')
 * async changePassword() {
 *   // This will throw ForbiddenException if user is impersonating
 * }
 * ```
 */
export const NoImpersonation = () => UseGuards(NoImpersonationGuard);
