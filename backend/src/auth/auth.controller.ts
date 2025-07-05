import { Controller, Post, Body, UseGuards, Request, Get, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AuthService } from './auth.service';
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
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
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
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant: user.tenant,
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
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required or action not allowed while impersonating' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async impersonateUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser,
  ) {
    return this.authService.impersonateUser(currentUser, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stop-impersonation')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop impersonating a user' })
  @ApiResponse({ status: 201, description: 'Stopped impersonation successfully' })
  @ApiResponse({ status: 400, description: 'Not currently impersonating' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async stopImpersonation(@CurrentUser() user) {
    return this.authService.stopImpersonation(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tenant/logo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user tenant logo URL' })
  @ApiResponse({ status: 200, description: 'Tenant logo URL retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTenantLogo(@CurrentUser() user) {
    const logoUrl = await this.authService.getTenantLogoUrl(user.tenant.id);
    return { logo_url: logoUrl };
  }
}