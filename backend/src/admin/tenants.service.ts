import { Injectable, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../auth/entities/tenant.entity';
import { User, UserRole } from '../auth/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateTenantResponseDto } from './dto/create-tenant-response.dto';
import { StorageService } from '../storage/storage.service';
import { FileCategory } from '../storage/entities/file.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private authService: AuthService,
    private storageService: StorageService,
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
      language: createTenantDto.language || 'nl',
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
    const tenants = await this.tenantRepository.find({
      select: ['id', 'name', 'display_name', 'logo_url', 'language', 'is_active', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });

    // Generate actual logo URLs for MinIO-stored logos
    const tenantsWithLogos = await Promise.all(
      tenants.map(async (tenant) => {
        let actualLogoUrl = tenant.logo_url;
        
        // If logo is stored in MinIO, generate presigned URL
        if (tenant.logo_url && tenant.logo_url.startsWith('minio:')) {
          try {
            const logoUrl = await this.getLogoUrl(tenant.id);
            actualLogoUrl = logoUrl || undefined;
          } catch (error) {
            // If logo file is missing/corrupted, set to undefined
            actualLogoUrl = undefined;
          }
        }
        
        return {
          ...tenant,
          logo_url: actualLogoUrl,
        };
      })
    );

    return tenantsWithLogos;
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

    // Generate actual logo URL if stored in MinIO
    if (tenant.logo_url && tenant.logo_url.startsWith('minio:')) {
      try {
        const logoUrl = await this.getLogoUrl(tenant.id);
        tenant.logo_url = logoUrl || undefined;
      } catch (error) {
        // If logo file is missing/corrupted, set to undefined
        tenant.logo_url = undefined;
      }
    }

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

  async uploadLogo(tenantId: string, file: Express.Multer.File, userId: string) {
    // Check if tenant exists
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }

    try {
      // Upload file to storage service
      const uploadedFile = await this.storageService.uploadFile({
        file,
        tenantId,
        userId,
        category: FileCategory.TENANT_LOGO,
        isPublic: true, // Tenant logos should be publicly accessible
        metadata: {
          tenant_name: tenant.name,
          previous_logo_url: tenant.logo_url || null,
        },
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSizeBytes: 2 * 1024 * 1024, // 2MB
      });

      // Generate presigned URL for the logo
      const logoUrl = await this.storageService.generatePresignedUrl(
        uploadedFile.id,
        tenantId,
        7 * 24 * 60 * 60, // 7 days expiry
      );

      // Delete old logo if it exists and is stored in MinIO
      if (tenant.logo_url && tenant.logo_url.startsWith('minio:')) {
        try {
          const oldFileId = tenant.logo_url.replace('minio:', '');
          await this.storageService.deleteFile(oldFileId, tenantId, userId);
        } catch (error) {
          // Log but don't fail the upload if old logo deletion fails
          console.warn(`Failed to delete old logo: ${error.message}`);
        }
      }

      // Update tenant with new logo file ID
      await this.tenantRepository.update(tenantId, {
        logo_url: `minio:${uploadedFile.id}`, // Store file ID for reference
      });

      return {
        message: 'Logo uploaded successfully',
        file_id: uploadedFile.id,
        logo_url: logoUrl,
        mime_type: uploadedFile.mime_type,
        size_bytes: uploadedFile.size_bytes,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload logo');
    }
  }

  /**
   * Get logo URL for a tenant, handling both external URLs and MinIO-stored files
   */
  async getLogoUrl(tenantId: string): Promise<string | null> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant || !tenant.logo_url) {
      return null;
    }

    // Check if logo is stored in MinIO
    if (tenant.logo_url.startsWith('minio:')) {
      const fileId = tenant.logo_url.substring(6); // Remove 'minio:' prefix
      try {
        return await this.storageService.generatePresignedUrl(fileId, tenantId);
      } catch (error) {
        // If file not found or error, return null
        return null;
      }
    }

    // Return external URL as-is
    return tenant.logo_url;
  }
}