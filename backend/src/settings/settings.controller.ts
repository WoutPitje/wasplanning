import {
  Controller,
  Get,
  Post,
  UseGuards,
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
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NoImpersonation } from '../auth/decorators/no-impersonation.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { TenantsService } from '../admin/tenants.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { AuditService } from '../audit/audit.service';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('tenant')
  @ApiOperation({ summary: 'Get current tenant settings' })
  @ApiResponse({
    status: 200,
    description: 'Tenant settings retrieved successfully',
  })
  async getTenantSettings(@CurrentUser() user: any) {
    if (!user.tenant) {
      throw new BadRequestException('User must belong to a tenant');
    }

    const tenant = await this.tenantsService.findOne(user.tenant.id);
    const logoUrl = await this.tenantsService.getLogoUrl(user.tenant.id);

    let subscription = null;
    try {
      subscription = await this.subscriptionsService.getCurrentSubscription(
        user.tenant.id,
      );
    } catch (error) {
      // If subscription lookup fails, continue without it
      console.warn(
        `Failed to get subscription for tenant ${user.tenant.id}:`,
        error.message,
      );
    }

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        logo_url: logoUrl,
      },
      subscription: subscription
        ? {
            plan_name: subscription.plan_name,
            display_name: subscription.plan_display_name,
            features: subscription.features,
          }
        : null,
    };
  }

  @Post('tenant/logo')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GARAGE_ADMIN)
  @ApiOperation({
    summary: 'Upload logo for current tenant (Garage Admin only)',
  })
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
  @ApiResponse({
    status: 400,
    description:
      'Invalid file format or subscription plan does not allow custom branding',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Garage Admin access required',
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTenantLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!user.tenant) {
      throw new BadRequestException('User must belong to a tenant');
    }

    // Check if the tenant's subscription plan allows custom branding
    const subscription = await this.subscriptionsService.getCurrentSubscription(
      user.tenant.id,
    );
    if (!subscription || !subscription.features.custom_branding) {
      throw new BadRequestException(
        'Your current subscription plan does not include custom branding. Please upgrade to Standard or Enterprise plan.',
      );
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

    const result = await this.tenantsService.uploadLogo(
      user.tenant.id,
      file,
      user.id,
    );

    // Log logo upload
    await this.auditService.logAction({
      tenant_id: user.tenant.id,
      user_id: user.id,
      action: 'tenant.logo.uploaded',
      resource_type: 'tenant',
      resource_id: user.tenant.id,
      details: {
        uploaded_by: user.email,
        file_size: file.size,
        file_type: file.mimetype,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }
}
