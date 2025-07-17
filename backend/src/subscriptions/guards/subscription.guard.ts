import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LimitsService, LimitType } from '../services/limits.service';

export const CheckLimit = (limitType: LimitType) =>
  Reflect.metadata('limitType', limitType);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private limitsService: LimitsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.get<LimitType>(
      'limitType',
      context.getHandler(),
    );

    if (!limitType) {
      return true; // No limit check required
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenant?.id || request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID not found in request');
    }

    let allowed = false;
    let limitInfo: any;

    switch (limitType) {
      case LimitType.CARS_WASHED:
        allowed = await this.limitsService.canWashCar(tenantId);
        if (!allowed) {
          limitInfo = await this.limitsService.getLimitsAndUsage(tenantId);
          throw new ForbiddenException({
            error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            message:
              "Je hebt het maximale aantal auto's voor deze maand bereikt",
            details: {
              type: 'cars_washed',
              current: limitInfo.cars_washed.current,
              limit: limitInfo.cars_washed.limit,
              percentage: limitInfo.cars_washed.percentage,
            },
            upgradeUrl: '/garage-admin/subscription',
          });
        }
        break;

      case LimitType.ACTIVE_USERS:
        allowed = await this.limitsService.canCreateUser(tenantId);
        if (!allowed) {
          limitInfo = await this.limitsService.getLimitsAndUsage(tenantId);
          throw new ForbiddenException({
            error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            message:
              'Je hebt het maximale aantal gebruikers voor je abonnement bereikt',
            details: {
              type: 'active_users',
              current: limitInfo.active_users.current,
              limit: limitInfo.active_users.limit,
              percentage: limitInfo.active_users.percentage,
            },
            upgradeUrl: '/garage-admin/subscription',
          });
        }
        break;

      case LimitType.LOCATIONS:
        allowed = await this.limitsService.canCreateLocation(tenantId);
        if (!allowed) {
          limitInfo = await this.limitsService.getLimitsAndUsage(tenantId);
          throw new ForbiddenException({
            error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            message:
              'Je hebt het maximale aantal locaties voor je abonnement bereikt',
            details: {
              type: 'locations',
              current: limitInfo.locations.current,
              limit: limitInfo.locations.limit,
              percentage: limitInfo.locations.percentage,
            },
            upgradeUrl: '/garage-admin/subscription',
          });
        }
        break;
    }

    return true;
  }
}
