import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ImpersonateUserDto } from './dto/impersonate-user.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { NoImpersonation } from './decorators/no-impersonation.decorator';
import { UserRole } from './entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private auditService: AuditService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    const result = await this.authService.login(req.user);

    // Log successful login
    await this.auditService.logAction({
      tenant_id: req.user.tenant?.id,
      user_id: req.user.id,
      action: 'auth.login',
      resource_type: 'user',
      resource_id: req.user.id,
      details: {
        email: req.user.email,
        role: req.user.role,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: user.tenant || null,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('impersonate/:userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Impersonate a user (Super Admin only)' })
  @ApiParam({ name: 'userId', description: 'ID of the user to impersonate' })
  @ApiResponse({ status: 201, description: 'Impersonation successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Super Admin access required or action not allowed while impersonating',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async impersonateUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: any,
    @Request() req: any,
  ) {
    const result = await this.authService.impersonateUser(currentUser, userId);

    // Log impersonation start
    await this.auditService.logAction({
      tenant_id: currentUser.tenant?.id,
      user_id: currentUser.id,
      action: 'auth.impersonate.start',
      resource_type: 'user',
      resource_id: userId,
      details: {
        impersonator_id: currentUser.id,
        impersonator_email: currentUser.email,
        target_user_id: userId,
        target_user_email: result.user.email,
        target_user_role: result.user.role,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('stop-impersonation')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop impersonating a user' })
  @ApiResponse({
    status: 201,
    description: 'Stopped impersonation successfully',
  })
  @ApiResponse({ status: 400, description: 'Not currently impersonating' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async stopImpersonation(@CurrentUser() user: any, @Request() req: any) {
    const result = await this.authService.stopImpersonation(user);

    // Log impersonation stop
    await this.auditService.logAction({
      tenant_id: result.user.tenant?.id,
      user_id: user.impersonation.impersonator_id,
      action: 'auth.impersonate.stop',
      resource_type: 'user',
      resource_id: user.id,
      details: {
        impersonator_id: user.impersonation.impersonator_id,
        impersonated_user_id: user.id,
        impersonated_user_email: user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant/logo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tenant logo URL' })
  @ApiResponse({
    status: 200,
    description: 'Tenant logo URL retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTenantLogo(@CurrentUser() user: any) {
    if (!user.tenant) {
      return { logo_url: null };
    }
    const logoUrl = await this.authService.getTenantLogoUrl(user.tenant.id);
    return { logo_url: logoUrl };
  }
}
