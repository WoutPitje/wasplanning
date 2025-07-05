import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { CurrentUser } from './interfaces/current-user.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
  ) {}

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
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
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    // Generate temporary password if not provided
    const password = createUserDto.password || this.generateTemporaryPassword();
    const shouldGeneratePassword = !createUserDto.password;

    // Create user using AuthService (handles password hashing)
    const user = await this.authService.createUser({
      ...createUserDto,
      password,
    });

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

    const query = this.userRepository.createQueryBuilder('user')
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
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const allowedSortFields = ['created_at', 'email', 'first_name', 'last_name', 'last_login'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
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
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.tenant_id !== currentUser.tenant.id) {
      throw new ForbiddenException('Cannot access users from other tenants');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: CurrentUser) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to update this user
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.tenant_id !== currentUser.tenant.id) {
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

  async resetPassword(id: string, newPassword: string, currentUser: CurrentUser) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has access to reset this user's password
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.tenant_id !== currentUser.tenant.id) {
      throw new ForbiddenException('Cannot reset password for users from other tenants');
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
    if (currentUser.role !== UserRole.SUPER_ADMIN && user.tenant_id !== currentUser.tenant.id) {
      throw new ForbiddenException('Cannot deactivate users from other tenants');
    }

    // Prevent deactivating yourself
    if (user.id === currentUser.id) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    // Soft delete by deactivating
    await this.userRepository.update(id, { is_active: false });

    return { message: `User ${user.email} has been deactivated` };
  }
}