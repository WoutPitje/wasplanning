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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    // Garage admin can only create users in their tenant
    if (req.user.role === UserRole.GARAGE_ADMIN && createUserDto.tenant_id !== req.user.tenant.id) {
      throw new ForbiddenException('Cannot create users for other tenants');
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of users',
  })
  findAll(@Request() req) {
    // Super admin can see all users, others only their tenant
    const tenantId = req.user.role === UserRole.SUPER_ADMIN ? undefined : req.user.tenant.id;
    return this.usersService.findAll(tenantId);
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
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
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
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(id, updateUserDto, req.user);
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
  @ApiResponse({ status: 403, description: 'Action not allowed while impersonating' })
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req,
  ) {
    return this.usersService.resetPassword(id, resetPasswordDto.new_password, req.user);
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
  @ApiResponse({ status: 403, description: 'Action not allowed while impersonating' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.usersService.remove(id, req.user);
  }
}