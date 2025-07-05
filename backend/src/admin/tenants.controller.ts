import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { NoImpersonation } from '../auth/decorators/no-impersonation.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Admin - Tenants')
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant with admin user' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully with admin user',
  })
  @ApiResponse({
    status: 409,
    description: 'Tenant name or email already exists',
  })
  async create(@Body() createTenantDto: CreateTenantDto, @Request() req: any) {
    const result = await this.tenantsService.create(createTenantDto);

    // Log tenant creation
    await this.auditService.logAction({
      tenant_id: req.user.tenant?.id,
      user_id: req.user.id,
      action: 'tenant.created',
      resource_type: 'tenant',
      resource_id: result.tenant.id,
      details: {
        tenant_name: result.tenant.name,
        admin_email: result.admin_user.email,
        created_by: req.user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({
    status: 200,
    description: 'List of all tenants',
  })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID with users' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tenant details with users',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tenant statistics',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  getStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() req: any,
  ) {
    const tenant = await this.tenantsService.update(id, updateTenantDto);

    if (tenant) {
      // Log tenant update
      await this.auditService.logAction({
        tenant_id: req.user.tenant?.id,
        user_id: req.user.id,
        action: 'tenant.updated',
        resource_type: 'tenant',
        resource_id: tenant.id,
        details: {
          updated_fields: Object.keys(updateTenantDto),
          updated_by: req.user.email,
        },
        ip_address: req.ip || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent'],
      });
    }

    return tenant;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Tenant deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    // Get tenant info before deactivation for logging
    const tenant = await this.tenantsService.findOne(id);
    
    const result = await this.tenantsService.remove(id);

    // Log tenant deactivation
    await this.auditService.logAction({
      tenant_id: req.user.tenant?.id,
      user_id: req.user.id,
      action: 'tenant.deactivated',
      resource_type: 'tenant',
      resource_id: id,
      details: {
        tenant_name: tenant.name,
        deactivated_by: req.user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @Post(':id/logo')
  @ApiOperation({ summary: 'Upload tenant logo' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logo uploaded successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  @UseInterceptors(FileInterceptor('file'))
  @NoImpersonation()
  async uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed',
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 2MB limit');
    }

    return this.tenantsService.uploadLogo(id, file, user.id);
  }

  @Get(':id/logo')
  @ApiOperation({ summary: 'Get tenant logo URL' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Logo URL retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        logo_url: {
          type: 'string',
          nullable: true,
          description:
            'Presigned URL for the logo (expires in 7 days) or null if no logo',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getLogo(@Param('id', ParseUUIDPipe) id: string) {
    const logoUrl = await this.tenantsService.getLogoUrl(id);
    return { logo_url: logoUrl };
  }
}
