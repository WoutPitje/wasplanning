import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { UserLocation } from './entities/user-location.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('LocationsService', () => {
  let service: LocationsService;
  let locationRepository: Repository<Location>;
  let userLocationRepository: Repository<UserLocation>;
  let subscriptionsService: SubscriptionsService;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockLocationId = 'location-123';

  const mockLocation: Location = {
    id: mockLocationId,
    tenant_id: mockTenantId,
    name: 'Test Location',
    address: '123 Test Street',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    tenant: null,
  };

  const mockLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockUserLocationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  const mockSubscriptionsService = {
    getCurrentSubscription: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: getRepositoryToken(Location),
          useValue: mockLocationRepository,
        },
        {
          provide: getRepositoryToken(UserLocation),
          useValue: mockUserLocationRepository,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    locationRepository = module.get<Repository<Location>>(
      getRepositoryToken(Location),
    );
    userLocationRepository = module.get<Repository<UserLocation>>(
      getRepositoryToken(UserLocation),
    );
    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'New Location',
      address: '456 New Street',
    };

    it('should create a location when within limits', async () => {
      mockLocationRepository.count.mockResolvedValue(0);
      mockSubscriptionsService.getCurrentSubscription.mockResolvedValue({
        usage: { locations: { limit: 3 } },
      });
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);

      const result = await service.create(createDto, mockTenantId);

      expect(mockLocationRepository.count).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId, is_active: true },
      });
      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenant_id: mockTenantId,
      });
      expect(mockLocationRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockLocation.id,
        name: mockLocation.name,
        address: mockLocation.address,
        is_active: mockLocation.is_active,
        created_at: mockLocation.created_at,
        updated_at: mockLocation.updated_at,
      });
    });

    it('should throw ForbiddenException when at location limit', async () => {
      mockLocationRepository.count.mockResolvedValue(3);
      mockSubscriptionsService.getCurrentSubscription.mockResolvedValue({
        usage: { locations: { limit: 3 } },
      });

      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockLocationRepository.create).not.toHaveBeenCalled();
      expect(mockLocationRepository.save).not.toHaveBeenCalled();
    });

    it('should use free tier limit when subscription service throws error', async () => {
      mockLocationRepository.count.mockResolvedValue(0);
      mockSubscriptionsService.getCurrentSubscription.mockRejectedValue(
        new Error('No subscription'),
      );
      mockLocationRepository.create.mockReturnValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(mockLocation);

      const result = await service.create(createDto, mockTenantId);

      expect(result).toBeDefined();
      expect(mockLocationRepository.save).toHaveBeenCalled();
    });

    it('should enforce free tier limit of 1 location', async () => {
      mockLocationRepository.count.mockResolvedValue(1);
      mockSubscriptionsService.getCurrentSubscription.mockRejectedValue(
        new Error('No subscription'),
      );

      await expect(service.create(createDto, mockTenantId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all active locations for tenant', async () => {
      const mockLocations = [
        mockLocation,
        { ...mockLocation, id: 'location-456' },
      ];
      mockLocationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.findAll(mockTenantId);

      expect(mockLocationRepository.find).toHaveBeenCalledWith({
        where: { tenant_id: mockTenantId, is_active: true },
        order: { name: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
    });

    it('should return empty array when no locations found', async () => {
      mockLocationRepository.find.mockResolvedValue([]);

      const result = await service.findAll(mockTenantId);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findOne(mockLocationId, mockTenantId);

      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockLocationId, tenant_id: mockTenantId },
      });
      expect(result).toEqual({
        id: mockLocation.id,
        name: mockLocation.name,
        address: mockLocation.address,
        is_active: mockLocation.is_active,
        created_at: mockLocation.created_at,
        updated_at: mockLocation.updated_at,
      });
    });

    it('should throw NotFoundException when location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(mockLocationId, mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Updated Location',
      address: 'Updated Address',
    };

    it('should update a location', async () => {
      const updatedLocation = { ...mockLocation, ...updateDto };
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue(updatedLocation);

      const result = await service.update(
        mockLocationId,
        updateDto,
        mockTenantId,
      );

      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockLocationId, tenant_id: mockTenantId },
      });
      expect(mockLocationRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateDto.name);
      expect(result.address).toBe(updateDto.address);
    });

    it('should throw NotFoundException when location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockLocationId, updateDto, mockTenantId),
      ).rejects.toThrow(NotFoundException);

      expect(mockLocationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete a location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockLocationRepository.save.mockResolvedValue({
        ...mockLocation,
        is_active: false,
      });

      await service.remove(mockLocationId, mockTenantId);

      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockLocationId, tenant_id: mockTenantId },
      });
      expect(mockLocationRepository.save).toHaveBeenCalledWith({
        ...mockLocation,
        is_active: false,
      });
    });

    it('should throw NotFoundException when location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(mockLocationId, mockTenantId),
      ).rejects.toThrow(NotFoundException);

      expect(mockLocationRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('assignUsers', () => {
    const assignUsersDto = {
      user_ids: ['user-1', 'user-2'],
    };

    it('should assign users to location', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserLocationRepository.findOne.mockResolvedValue(null);
      mockUserLocationRepository.create.mockImplementation((data) => data);
      mockUserLocationRepository.save.mockImplementation((data) => data);

      await service.assignUsers(mockLocationId, assignUsersDto, mockTenantId);

      expect(mockLocationRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockLocationId, tenant_id: mockTenantId },
      });
      expect(mockUserLocationRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUserLocationRepository.create).toHaveBeenCalledTimes(2);
      expect(mockUserLocationRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should skip users already assigned', async () => {
      mockLocationRepository.findOne.mockResolvedValue(mockLocation);
      mockUserLocationRepository.findOne.mockResolvedValueOnce({
        id: 'existing-assignment',
      });
      mockUserLocationRepository.findOne.mockResolvedValueOnce(null);
      mockUserLocationRepository.create.mockImplementation((data) => data);
      mockUserLocationRepository.save.mockImplementation((data) => data);

      await service.assignUsers(mockLocationId, assignUsersDto, mockTenantId);

      expect(mockUserLocationRepository.create).toHaveBeenCalledTimes(1);
      expect(mockUserLocationRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when location not found', async () => {
      mockLocationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignUsers(mockLocationId, assignUsersDto, mockTenantId),
      ).rejects.toThrow(NotFoundException);

      expect(mockUserLocationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('removeUserFromLocation', () => {
    it('should remove user from location', async () => {
      mockUserLocationRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeUserFromLocation(mockLocationId, mockUserId);

      expect(mockUserLocationRepository.delete).toHaveBeenCalledWith({
        location_id: mockLocationId,
        user_id: mockUserId,
      });
    });

    it('should throw NotFoundException when assignment not found', async () => {
      mockUserLocationRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeUserFromLocation(mockLocationId, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserLocations', () => {
    it('should return user locations', async () => {
      const mockUserLocations = [
        {
          id: 'ul-1',
          user_id: mockUserId,
          location_id: mockLocationId,
          location: mockLocation,
        },
      ];
      mockUserLocationRepository.find.mockResolvedValue(mockUserLocations);

      const result = await service.getUserLocations(mockUserId);

      expect(mockUserLocationRepository.find).toHaveBeenCalledWith({
        where: { user_id: mockUserId },
        relations: ['location'],
      });
      expect(result).toEqual([mockLocation]);
    });

    it('should return empty array when user has no locations', async () => {
      mockUserLocationRepository.find.mockResolvedValue([]);

      const result = await service.getUserLocations(mockUserId);

      expect(result).toEqual([]);
    });
  });
});
