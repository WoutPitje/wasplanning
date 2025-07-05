import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  tenant: {
    id: string;
    name: string;
    display_name: string;
    language: string;
  };
  impersonator_id?: string;
  is_impersonating?: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    tenant: {
      id: string;
      name: string;
      display_name: string;
      language: string;
    };
  };
  impersonation?: {
    is_impersonating: boolean;
    impersonator_id: string;
    impersonator_email?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, is_active: true },
      relations: ['tenant'],
    });

    if (user && await bcrypt.compare(password, user.password)) {
      // Update last login
      await this.userRepository.update(user.id, { last_login: new Date() });
      return user;
    }

    return null;
  }

  async login(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        display_name: user.tenant.display_name,
        language: user.tenant.language,
      },
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          display_name: user.tenant.display_name,
          language: user.tenant.language,
        },
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.id, is_active: true },
        relations: ['tenant'],
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // If this is an impersonation session, preserve the impersonation fields
      if (payload.is_impersonating && payload.impersonator_id) {
        const impersonator = await this.userRepository.findOne({
          where: { id: payload.impersonator_id, is_active: true },
        });

        if (!impersonator) {
          throw new UnauthorizedException('Impersonator not found');
        }

        const newPayload: JwtPayload = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            display_name: user.tenant.display_name,
            language: user.tenant.language,
          },
          impersonator_id: payload.impersonator_id,
          is_impersonating: true,
        };

        const accessToken = this.jwtService.sign(newPayload);
        const newRefreshToken = this.jwtService.sign(newPayload, {
          expiresIn: '30d',
        });

        return {
          access_token: accessToken,
          refresh_token: newRefreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            tenant: {
              id: user.tenant.id,
              name: user.tenant.name,
              display_name: user.tenant.display_name,
              language: user.tenant.language,
            },
          },
          impersonation: {
            is_impersonating: true,
            impersonator_id: impersonator.id,
            impersonator_email: impersonator.email,
          },
        };
      }

      return this.login(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async createUser(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
    tenant_id: string;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.userRepository.save(user);
  }

  async impersonateUser(currentUser: any, targetUserId: string): Promise<AuthResponse> {
    // Prevent nested impersonation
    if (currentUser.impersonation?.is_impersonating) {
      throw new ForbiddenException('Cannot impersonate while already impersonating another user');
    }

    // Load the impersonator user to verify they are SUPER_ADMIN
    const impersonator = await this.userRepository.findOne({
      where: { id: currentUser.id, is_active: true },
      relations: ['tenant'],
    });

    if (!impersonator) {
      throw new UnauthorizedException('Impersonator not found');
    }

    if (impersonator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can impersonate users');
    }

    // Load the target user with tenant relation
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['tenant'],
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (!targetUser.is_active) {
      throw new ForbiddenException('Cannot impersonate inactive user');
    }

    if (targetUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot impersonate another SUPER_ADMIN');
    }

    // Create JWT payload with impersonation fields
    const payload: JwtPayload = {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      tenant: {
        id: targetUser.tenant.id,
        name: targetUser.tenant.name,
        display_name: targetUser.tenant.display_name,
        language: targetUser.tenant.language,
      },
      impersonator_id: impersonator.id,
      is_impersonating: true,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    // Return auth response with impersonation info
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        tenant: {
          id: targetUser.tenant.id,
          name: targetUser.tenant.name,
          display_name: targetUser.tenant.display_name,
          language: targetUser.tenant.language,
        },
      },
      impersonation: {
        is_impersonating: true,
        impersonator_id: impersonator.id,
        impersonator_email: impersonator.email,
      },
    };
  }

  async stopImpersonation(currentUser: any): Promise<AuthResponse> {
    // Verify user is currently impersonating
    if (!currentUser.impersonation?.is_impersonating || !currentUser.impersonation?.impersonator_id) {
      throw new ForbiddenException('User is not currently impersonating');
    }

    // Load original superadmin user
    const superAdmin = await this.userRepository.findOne({
      where: { id: currentUser.impersonation.impersonator_id, is_active: true },
      relations: ['tenant'],
    });

    if (!superAdmin) {
      throw new UnauthorizedException('Original superadmin not found');
    }

    if (superAdmin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('Original user is not a SUPER_ADMIN');
    }

    // Create regular JWT without impersonation fields
    return this.login(superAdmin);
  }
}