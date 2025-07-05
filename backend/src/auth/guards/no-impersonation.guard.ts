import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class NoImpersonationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check if the user is impersonating
    if (user.impersonation?.is_impersonating === true) {
      throw new ForbiddenException(
        'This action is not allowed while impersonating another user',
      );
    }

    return true;
  }
}
