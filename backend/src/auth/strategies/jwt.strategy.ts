import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { JwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback-secret',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, is_active: true },
      relations: ['tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (!user.tenant.is_active) {
      throw new UnauthorizedException('Tenant is inactive');
    }

    // Return user with tenant context for use in guards and controllers
    return {
      sub: user.id, // Keep for backward compatibility
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        display_name: user.tenant.display_name,
      },
      tenantId: user.tenant.id, // Keep for backward compatibility
    };
  }
}