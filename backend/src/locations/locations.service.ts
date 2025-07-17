import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './entities/location.entity';
import { UserLocation } from './entities/user-location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { LimitsService } from '../subscriptions/services/limits.service';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    @InjectRepository(UserLocation)
    private userLocationRepository: Repository<UserLocation>,
    private subscriptionsService: SubscriptionsService,
    private limitsService: LimitsService,
  ) {}

  async create(
    createLocationDto: CreateLocationDto,
    tenantId: string,
  ): Promise<LocationResponseDto> {
    // Check subscription limits
    const canCreate = await this.checkLocationLimit(tenantId);
    if (!canCreate) {
      throw new ForbiddenException(
        'Location limit reached for your subscription plan',
      );
    }

    // Create location
    const location = this.locationRepository.create({
      ...createLocationDto,
      tenant_id: tenantId,
    });

    const savedLocation = await this.locationRepository.save(location);
    return this.toResponseDto(savedLocation);
  }

  async findAll(tenantId: string): Promise<LocationResponseDto[]> {
    const locations = await this.locationRepository.find({
      where: { tenant_id: tenantId, is_active: true },
      order: { name: 'ASC' },
    });

    return locations.map((location) => this.toResponseDto(location));
  }

  async findOne(id: string, tenantId: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return this.toResponseDto(location);
  }

  async update(
    id: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
  ): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    Object.assign(location, updateLocationDto);
    const updatedLocation = await this.locationRepository.save(location);

    return this.toResponseDto(updatedLocation);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Soft delete
    location.is_active = false;
    await this.locationRepository.save(location);
  }

  async assignUsers(
    locationId: string,
    assignUsersDto: AssignUsersDto,
    tenantId: string,
  ): Promise<void> {
    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: locationId, tenant_id: tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Process each user
    for (const userId of assignUsersDto.user_ids) {
      // Check if assignment already exists
      const existing = await this.userLocationRepository.findOne({
        where: { user_id: userId, location_id: locationId },
      });

      if (!existing) {
        // Create new assignment
        const userLocation = this.userLocationRepository.create({
          user_id: userId,
          location_id: locationId,
        });
        await this.userLocationRepository.save(userLocation);
      }
    }
  }

  async removeUserFromLocation(
    locationId: string,
    userId: string,
  ): Promise<void> {
    const result = await this.userLocationRepository.delete({
      location_id: locationId,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User location assignment not found');
    }
  }

  async getUserLocations(userId: string): Promise<Location[]> {
    const userLocations = await this.userLocationRepository.find({
      where: { user_id: userId },
      relations: ['location'],
    });

    return userLocations.map((ul) => ul.location);
  }

  async getLocationUsers(locationId: string, tenantId: string): Promise<any[]> {
    // Verify location exists and belongs to tenant
    const location = await this.locationRepository.findOne({
      where: { id: locationId, tenant_id: tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Get all user assignments for this location
    const userLocations = await this.userLocationRepository.find({
      where: { location_id: locationId },
      relations: ['user'],
    });

    // Return user data
    return userLocations.map((ul) => ({
      id: ul.user.id,
      email: ul.user.email,
      first_name: ul.user.first_name,
      last_name: ul.user.last_name,
      is_active: ul.user.is_active,
      role: ul.user.role,
      assigned_at: ul.created_at,
    }));
  }

  private async checkLocationLimit(tenantId: string): Promise<boolean> {
    return this.limitsService.canCreateLocation(tenantId);
  }

  private toResponseDto(location: Location): LocationResponseDto {
    return {
      id: location.id,
      name: location.name,
      address: location.address,
      is_active: location.is_active,
      created_at: location.created_at,
      updated_at: location.updated_at,
    };
  }
}
