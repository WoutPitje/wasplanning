import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
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
import { UserRole } from './entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('refresh')
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Impersonate a user (Super Admin only)' })
  @ApiParam({ name: 'userId', description: 'ID of the user to impersonate' })
  @ApiResponse({ status: 200, description: 'Impersonation successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async impersonateUser(
    @Param('userId') userId: string,
    @CurrentUser() currentUser,
  ) {
    return this.authService.impersonateUser(currentUser, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('stop-impersonation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stop impersonating a user' })
  @ApiResponse({ status: 200, description: 'Stopped impersonation successfully' })
  @ApiResponse({ status: 400, description: 'Not currently impersonating' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async stopImpersonation(@CurrentUser() user) {
    return this.authService.stopImpersonation(user);
  }
}