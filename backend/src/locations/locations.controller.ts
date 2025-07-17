import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('locations')
@Controller('locations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Location limit reached for subscription plan',
  })
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @Request() req: any,
  ): Promise<LocationResponseDto> {
    return this.locationsService.create(createLocationDto, req.user.tenant.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations for tenant' })
  @ApiResponse({
    status: 200,
    description: 'List of locations',
    type: [LocationResponseDto],
  })
  async findAll(@Request() req: any): Promise<LocationResponseDto[]> {
    return this.locationsService.findAll(req.user.tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  @ApiResponse({
    status: 200,
    description: 'Location details',
    type: LocationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<LocationResponseDto> {
    return this.locationsService.findOne(id, req.user.tenant.id);
  }

  @Patch(':id')
  @Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update location' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully',
    type: LocationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async update(
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
    @Request() req: any,
  ): Promise<LocationResponseDto> {
    return this.locationsService.update(
      id,
      updateLocationDto,
      req.user.tenant.id,
    );
  }

  @Delete(':id')
  @Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete location' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    return this.locationsService.remove(id, req.user.tenant.id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Get users assigned to location' })
  @ApiResponse({
    status: 200,
    description: 'List of users assigned to location',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationUsers(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<any[]> {
    return this.locationsService.getLocationUsers(id, req.user.tenant.id);
  }

  @Post(':id/users')
  @Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Assign users to location' })
  @ApiResponse({ status: 200, description: 'Users assigned successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async assignUsers(
    @Param('id') id: string,
    @Body() assignUsersDto: AssignUsersDto,
    @Request() req: any,
  ): Promise<void> {
    return this.locationsService.assignUsers(
      id,
      assignUsersDto,
      req.user.tenant.id,
    );
  }

  @Delete(':id/users/:userId')
  @Roles(UserRole.GARAGE_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove user from location' })
  @ApiResponse({ status: 200, description: 'User removed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    return this.locationsService.removeUserFromLocation(id, userId);
  }
}
