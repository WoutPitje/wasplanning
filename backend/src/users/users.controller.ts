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
  Request,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NoImpersonation } from '../auth/decorators/no-impersonation.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    // Garage admin can only create users in their tenant
    if (
      req.user.role === UserRole.GARAGE_ADMIN &&
      createUserDto.tenant_id !== req.user.tenant.id
    ) {
      throw new ForbiddenException('Cannot create users for other tenants');
    }

    const user = await this.usersService.create(createUserDto);

    // Log user creation
    await this.auditService.logAction({
      tenant_id: user.tenant_id,
      user_id: req.user.id,
      action: 'user.created',
      resource_type: 'user',
      resource_id: user.id,
      details: {
        email: user.email,
        role: user.role,
        created_by: req.user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return user;
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users',
  })
  async findAll(@Query() query: GetUsersQueryDto, @Request() req: any) {
    // Super admin can filter by tenant, others only see their tenant
    if (req.user.role !== UserRole.SUPER_ADMIN) {
      query.tenant = req.user.tenant.id;
    }

    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User details',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ) {
    const user = await this.usersService.update(id, updateUserDto, req.user);

    // Log user update
    await this.auditService.logAction({
      tenant_id: user.tenant_id,
      user_id: req.user.id,
      action: 'user.updated',
      resource_type: 'user',
      resource_id: user.id,
      details: {
        updated_fields: Object.keys(updateUserDto),
        updated_by: req.user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return user;
  }

  @Patch(':id/password')
  @NoImpersonation()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Action not allowed while impersonating',
  })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req: any,
  ) {
    // Get user data before reset for logging
    const user = await this.usersService.findOne(id, req.user);
    
    const result = await this.usersService.resetPassword(
      id,
      resetPasswordDto.new_password,
      req.user,
    );

    // Log password reset
    await this.auditService.logAction({
      tenant_id: user.tenant.id,
      user_id: req.user.id,
      action: 'user.password_reset',
      resource_type: 'user',
      resource_id: id,
      details: {
        reset_by: req.user.email,
        user_email: user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }

  @Delete(':id')
  @NoImpersonation()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 403,
    description: 'Action not allowed while impersonating',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    // Get user data before deactivation for logging
    const user = await this.usersService.findOne(id, req.user);
    
    const result = await this.usersService.remove(id, req.user);

    // Log user deactivation
    await this.auditService.logAction({
      tenant_id: user.tenant.id,
      user_id: req.user.id,
      action: 'user.deactivated',
      resource_type: 'user',
      resource_id: id,
      details: {
        deactivated_by: req.user.email,
        user_email: user.email,
      },
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
    });

    return result;
  }
}
