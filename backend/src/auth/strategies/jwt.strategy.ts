import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../auth.service';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required but not set',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // Handle impersonation
    if (payload.is_impersonating && payload.impersonator_id) {
      // Load the impersonated user
      const impersonatedUser = await this.userRepository.findOne({
        where: { id: payload.id, is_active: true },
        relations: ['tenant'],
      });

      if (!impersonatedUser) {
        throw new UnauthorizedException(
          'Impersonated user not found or inactive',
        );
      }

      // Verify the impersonator still exists and is active
      const impersonator = await this.userRepository.findOne({
        where: { id: payload.impersonator_id, is_active: true },
        relations: ['tenant'],
      });

      if (!impersonator) {
        throw new UnauthorizedException('Impersonator not found or inactive');
      }

      // Check if impersonator's tenant is active (unless they're super admin)
      if (impersonator.role !== UserRole.SUPER_ADMIN) {
        if (!impersonator.tenant) {
          throw new UnauthorizedException('Impersonator must belong to a tenant');
        }
        if (!impersonator.tenant.is_active) {
          throw new UnauthorizedException('Impersonator tenant is inactive');
        }
      }

      // Check if impersonated user's tenant is active (unless they're super admin)
      if (impersonatedUser.role !== UserRole.SUPER_ADMIN) {
        if (!impersonatedUser.tenant) {
          throw new UnauthorizedException('Impersonated user must belong to a tenant');
        }
        if (!impersonatedUser.tenant.is_active) {
          throw new UnauthorizedException('Impersonated user tenant is inactive');
        }
      }

      // Return impersonated user with impersonation details
      return {
        id: impersonatedUser.id,
        email: impersonatedUser.email,
        role: impersonatedUser.role,
        first_name: impersonatedUser.first_name,
        last_name: impersonatedUser.last_name,
        tenant: impersonatedUser.tenant ? {
          id: impersonatedUser.tenant.id,
          name: impersonatedUser.tenant.name,
          display_name: impersonatedUser.tenant.display_name,
          language: impersonatedUser.tenant.language,
        } : null,
        impersonation: {
          is_impersonating: true,
          impersonator_id: payload.impersonator_id,
          impersonator_email: impersonator.email,
        },
      };
    }

    // Normal authentication flow
    const user = await this.userRepository.findOne({
      where: { id: payload.id, is_active: true },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Skip tenant validation for super admin
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!user.tenant) {
        throw new UnauthorizedException('User must belong to a tenant');
      }
      if (!user.tenant.is_active) {
        throw new UnauthorizedException('Tenant is inactive');
      }
    }

    // Return user with tenant context for use in guards and controllers
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: user.tenant ? {
        id: user.tenant.id,
        name: user.tenant.name,
        display_name: user.tenant.display_name,
        language: user.tenant.language,
      } : null,
    };
  }
}
