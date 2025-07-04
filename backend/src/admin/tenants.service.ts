import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../auth/entities/tenant.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateTenantResponseDto } from './dto/create-tenant-response.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
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

  async create(createTenantDto: CreateTenantDto): Promise<CreateTenantResponseDto> {
    // Check if tenant name already exists
    const existingTenant = await this.tenantRepository.findOne({
      where: { name: createTenantDto.name },
    });

    if (existingTenant) {
      throw new ConflictException(`Tenant with name ${createTenantDto.name} already exists`);
    }

    // Check if admin email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createTenantDto.admin_email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${createTenantDto.admin_email} already exists`);
    }

    // Create tenant
    const tenant = this.tenantRepository.create({
      name: createTenantDto.name,
      display_name: createTenantDto.display_name,
      logo_url: createTenantDto.logo_url || '',
      is_active: true,
      settings: {},
    });

    const savedTenant = await this.tenantRepository.save(tenant);

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();

    // Create admin user
    const adminUser = await this.authService.createUser({
      email: createTenantDto.admin_email,
      password: temporaryPassword,
      first_name: createTenantDto.admin_first_name,
      last_name: createTenantDto.admin_last_name,
      role: UserRole.GARAGE_ADMIN,
      tenant_id: savedTenant.id,
    });

    return {
      tenant: {
        id: savedTenant.id,
        name: savedTenant.name,
        display_name: savedTenant.display_name,
        is_active: savedTenant.is_active,
      },
      admin_user: {
        id: adminUser.id,
        email: adminUser.email,
        first_name: adminUser.first_name,
        last_name: adminUser.last_name,
        temporary_password: temporaryPassword,
      },
      instructions: `Tenant created successfully. Please share the temporary password with the admin user. They will be required to change it on first login.`,
    };
  }

  async findAll() {
    return this.tenantRepository.find({
      select: ['id', 'name', 'display_name', 'logo_url', 'is_active', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Remove password from users
    tenant.users = tenant.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    await this.tenantRepository.update(id, updateTenantDto);

    return this.tenantRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Soft delete by deactivating
    await this.tenantRepository.update(id, { is_active: false });

    return { message: `Tenant ${tenant.name} has been deactivated` };
  }

  async getStats(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    const usersByRole = tenant.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      tenant_id: tenant.id,
      tenant_name: tenant.name,
      total_users: tenant.users.length,
      active_users: tenant.users.filter(u => u.is_active).length,
      users_by_role: usersByRole,
      created_at: tenant.created_at,
      last_updated: tenant.updated_at,
    };
  }
}