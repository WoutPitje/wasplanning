import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionsService } from '../subscriptions.service';
import { MetricType } from '../entities/usage-record.entity';

export const REQUIRE_FEATURE_KEY = 'requireFeature';
export const REQUIRE_LIMIT_KEY = 'requireLimit';

export const RequireFeature = (feature: string) => SetMetadata(REQUIRE_FEATURE_KEY, feature);
export const RequireLimit = (metricType: MetricType) => SetMetadata(REQUIRE_LIMIT_KEY, metricType);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenant) {
      throw new ForbiddenException('User or tenant not found');
    }

    const tenantId = user.tenant.id;

    // Check required feature
    const requiredFeature = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredFeature) {
      const hasFeature = await this.subscriptionsService.hasFeature(tenantId, requiredFeature);
      if (!hasFeature) {
        throw new ForbiddenException(`Feature '${requiredFeature}' not available with current subscription plan`);
      }
    }

    // Check required limit
    const requiredLimit = this.reflector.getAllAndOverride<MetricType>(REQUIRE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredLimit) {
      const canUse = await this.subscriptionsService.checkLimit(tenantId, requiredLimit);
      if (!canUse) {
        throw new ForbiddenException(`Usage limit exceeded for '${requiredLimit}'. Please upgrade your subscription plan.`);
      }
    }

    return true;
  }
}