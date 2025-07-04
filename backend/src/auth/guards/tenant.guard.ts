import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Super admin can access all tenants
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check if route has tenant parameter
    const tenantId = request.params?.tenantId;
    if (tenantId && tenantId !== user.tenant.id) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    // Add tenant context to request for use in services
    request.tenantId = user.tenant.id;
    request.tenantName = user.tenant.name;

    return true;
  }
}