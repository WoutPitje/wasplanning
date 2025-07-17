import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { LimitsService } from '../subscriptions/services/limits.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CurrentUser } from './interfaces/current-user.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { SubscriptionLimitExceededException } from '../subscriptions/interfaces/subscription-limits.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
    private emailService: EmailService,
    private limitsService: LimitsService,
    private auditService: AuditService,
  ) {}

  private generateTemporaryPassword(): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email ${createUserDto.email} already exists`,
      );
    }

    // Check subscription limits
    const canCreate = await this.limitsService.canCreateUser(
      createUserDto.tenant_id,
    );
    if (!canCreate) {
      const limitsInfo = await this.limitsService.getLimitsAndUsage(
        createUserDto.tenant_id,
      );

      // Log the limit exceeded attempt
      await this.auditService.logAction({
        tenant_id: createUserDto.tenant_id,
        user_id: null, // We don't have current user context here
        action: 'limit.exceeded',
        resource_type: 'user',
        resource_id: null,
        details: {
          type: 'active_users',
          current_usage: limitsInfo.active_users.current,
          limit: limitsInfo.active_users.limit,
          attempted_action: 'create_user',
          email: createUserDto.email,
        },
        ip_address: '127.0.0.1', // TODO: Get from request context
        user_agent: 'System',
      });

      throw new ForbiddenException({
        error: 'SUBSCRIPTION_LIMIT_EXCEEDED',
        message:
          'Je hebt het maximale aantal gebruikers voor je abonnement bereikt',
        details: {
          type: 'active_users',
          current: limitsInfo.active_users.current,
          limit: limitsInfo.active_users.limit,
          percentage: limitsInfo.active_users.percentage,
        },
        upgradeUrl: '/garage-admin/subscription',
      });
    }

    // Generate temporary password if not provided
    const password = createUserDto.password || this.generateTemporaryPassword();
    const shouldGeneratePassword = !createUserDto.password;

    // Create user using AuthService (handles password hashing)
    const user = await this.authService.createUser({
      ...createUserDto,
      password,
    });

    // Fetch user with tenant information for email
    const userWithTenant = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['tenant'],
    });

    // Send welcome email with tenant information
    try {
      await this.emailService.sendWelcomeEmail(user.email, {
        firstName: user.first_name || 'Gebruiker',
        lastName: user.last_name || '',
        temporaryPassword: shouldGeneratePassword ? password : undefined,
        tenantName:
          userWithTenant?.tenant?.display_name ||
          userWithTenant?.tenant?.name ||
          'Wasplanning',
      });
    } catch (emailError) {
      // Log error but don't fail user creation
      console.error('Failed to send welcome email:', emailError);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      ...(shouldGeneratePassword && { temporary_password: password }),
    };
  }

  async findAll(queryDto: GetUsersQueryDto): Promise<PaginatedResponse<User>> {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      tenant,
      is_active,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = queryDto;

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.role',
        'user.is_active',
        'user.last_login',
        'user.created_at',
        'tenant.id',
        'tenant.name',
        'tenant.display_name',
      ]);

    // Apply filters
    if (tenant) {
      query.andWhere('user.tenant_id = :tenantId', { tenantId: tenant });
    }

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (is_active !== undefined) {
      query.andWhere('user.is_active = :is_active', { is_active });
    }

    if (search) {
      query.andWhere(
        '(LOWER(user.email) LIKE LOWER(:search) OR ' +
          'LOWER(user.first_name) LIKE LOWER(:search) OR ' +
          'LOWER(user.last_name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    const allowedSortFields = [
      'created_at',
      'email',
      'first_name',
      'last_name',
      'last_login',
    ];
    const sortField = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'created_at';
    query.orderBy(`user.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Get results
    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: CurrentUser) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['tenant'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to view this user
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      user.tenant_id !== currentUser.tenant.id
    ) {
      throw new ForbiddenException('Cannot access users from other tenants');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: CurrentUser,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to update this user
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      user.tenant_id !== currentUser.tenant.id
    ) {
      throw new ForbiddenException('Cannot update users from other tenants');
    }

    // Prevent changing certain fields (even though they're not in UpdateUserDto, this is defensive)
    const allowedUpdates = { ...updateUserDto };

    // Only super admin can change roles
    if (updateUserDto.role && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admin can change user roles');
    }

    await this.userRepository.update(id, allowedUpdates);

    return this.findOne(id, currentUser);
  }

  async resetPassword(
    id: string,
    newPassword: string,
    currentUser: CurrentUser,
  ) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to reset this user's password
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      user.tenant_id !== currentUser.tenant.id
    ) {
      throw new ForbiddenException(
        'Cannot reset password for users from other tenants',
      );
    }

    // Hash the new password
    const hashedPassword = await this.authService.hashPassword(newPassword);

    await this.userRepository.update(id, { password: hashedPassword });

    return { message: 'Password reset successfully' };
  }

  async remove(id: string, currentUser: CurrentUser) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to deactivate this user
    if (
      currentUser.role !== UserRole.SUPER_ADMIN &&
      user.tenant_id !== currentUser.tenant.id
    ) {
      throw new ForbiddenException(
        'Cannot deactivate users from other tenants',
      );
    }

    // Prevent deactivating yourself
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    // Soft delete by deactivating
    await this.userRepository.update(id, { is_active: false });

    return { message: `User ${user.email} has been deactivated` };
  }

  async findTenantAdmins(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: {
        tenant_id: tenantId,
        role: UserRole.GARAGE_ADMIN,
        is_active: true,
      },
      select: ['id', 'email', 'first_name', 'last_name'],
    });
  }
}
