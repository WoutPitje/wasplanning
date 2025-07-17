import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionRestrictionService } from '../services/subscription-restriction.service';

export const ALLOW_READ_ONLY_KEY = 'allowReadOnly';

/**
 * Decorator to allow read-only access on specific endpoints
 */
export const AllowReadOnly = () => SetMetadata(ALLOW_READ_ONLY_KEY, true);

import { SetMetadata } from '@nestjs/common';

@Injectable()
export class SubscriptionRestrictionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionRestrictionService: SubscriptionRestrictionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if no user (handled by auth guard)
    if (!user || !user.tenant_id) {
      return true;
    }

    // Check if endpoint allows read-only access
    const allowReadOnly = this.reflector.getAllAndOverride<boolean>(
      ALLOW_READ_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );

    // For read operations (GET requests) with AllowReadOnly decorator, allow access
    if (allowReadOnly && request.method === 'GET') {
      return true;
    }

    // Check subscription restrictions
    const isReadOnly = await this.subscriptionRestrictionService.isReadOnly(
      user.tenant_id,
    );

    if (isReadOnly) {
      const details =
        await this.subscriptionRestrictionService.getRestrictionDetails(
          user.tenant_id,
        );

      throw new ForbiddenException({
        statusCode: 403,
        message: 'Access restricted due to subscription issues',
        error: 'SubscriptionRestricted',
        details: {
          reason: details.reason,
          gracePeriodEnd: details.gracePeriodEnd,
          daysRemaining: details.daysRemaining,
        },
      });
    }

    return true;
  }
}
