import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AssignUsersDto } from './dto/assign-users.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationsService;

  const mockRequest = {
    user: {
      id: 'user-123',
      tenant: {
        id: 'tenant-123',
      },
    },
  };

  const mockLocation = {
    id: 'location-123',
    name: 'Test Location',
    address: '123 Test Street',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockLocationsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    assignUsers: jest.fn(),
    removeUserFromLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationsService>(LocationsService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a location', async () => {
      const createDto: CreateLocationDto = {
        name: 'New Location',
        address: '456 New Street',
      };

      mockLocationsService.create.mockResolvedValue(mockLocation);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(
        createDto,
        mockRequest.user.tenant.id,
      );
      expect(result).toEqual(mockLocation);
    });

    it('should handle forbidden exception when limit reached', async () => {
      const createDto: CreateLocationDto = {
        name: 'New Location',
      };

      mockLocationsService.create.mockRejectedValue(
        new ForbiddenException('Location limit reached'),
      );

      await expect(controller.create(createDto, mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all locations', async () => {
      const mockLocations = [
        mockLocation,
        { ...mockLocation, id: 'location-456' },
      ];
      mockLocationsService.findAll.mockResolvedValue(mockLocations);

      const result = await controller.findAll(mockRequest);

      expect(service.findAll).toHaveBeenCalledWith(mockRequest.user.tenant.id);
      expect(result).toEqual(mockLocations);
    });

    it('should return empty array when no locations', async () => {
      mockLocationsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a location by id', async () => {
      mockLocationsService.findOne.mockResolvedValue(mockLocation);

      const result = await controller.findOne('location-123', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith(
        'location-123',
        mockRequest.user.tenant.id,
      );
      expect(result).toEqual(mockLocation);
    });

    it('should handle not found exception', async () => {
      mockLocationsService.findOne.mockRejectedValue(
        new NotFoundException('Location not found'),
      );

      await expect(
        controller.findOne('invalid-id', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a location', async () => {
      const updateDto: UpdateLocationDto = {
        name: 'Updated Location',
      };
      const updatedLocation = { ...mockLocation, ...updateDto };

      mockLocationsService.update.mockResolvedValue(updatedLocation);

      const result = await controller.update(
        'location-123',
        updateDto,
        mockRequest,
      );

      expect(service.update).toHaveBeenCalledWith(
        'location-123',
        updateDto,
        mockRequest.user.tenant.id,
      );
      expect(result).toEqual(updatedLocation);
    });

    it('should handle not found exception', async () => {
      const updateDto: UpdateLocationDto = { name: 'Updated' };

      mockLocationsService.update.mockRejectedValue(
        new NotFoundException('Location not found'),
      );

      await expect(
        controller.update('invalid-id', updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a location', async () => {
      mockLocationsService.remove.mockResolvedValue(undefined);

      await controller.remove('location-123', mockRequest);

      expect(service.remove).toHaveBeenCalledWith(
        'location-123',
        mockRequest.user.tenant.id,
      );
    });

    it('should handle not found exception', async () => {
      mockLocationsService.remove.mockRejectedValue(
        new NotFoundException('Location not found'),
      );

      await expect(
        controller.remove('invalid-id', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignUsers', () => {
    it('should assign users to location', async () => {
      const assignUsersDto: AssignUsersDto = {
        user_ids: ['user-1', 'user-2'],
      };

      mockLocationsService.assignUsers.mockResolvedValue(undefined);

      await controller.assignUsers('location-123', assignUsersDto, mockRequest);

      expect(service.assignUsers).toHaveBeenCalledWith(
        'location-123',
        assignUsersDto,
        mockRequest.user.tenant.id,
      );
    });

    it('should handle not found exception', async () => {
      const assignUsersDto: AssignUsersDto = {
        user_ids: ['user-1'],
      };

      mockLocationsService.assignUsers.mockRejectedValue(
        new NotFoundException('Location not found'),
      );

      await expect(
        controller.assignUsers('invalid-id', assignUsersDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUser', () => {
    it('should remove user from location', async () => {
      mockLocationsService.removeUserFromLocation.mockResolvedValue(undefined);

      await controller.removeUser('location-123', 'user-123');

      expect(service.removeUserFromLocation).toHaveBeenCalledWith(
        'location-123',
        'user-123',
      );
    });

    it('should handle not found exception', async () => {
      mockLocationsService.removeUserFromLocation.mockRejectedValue(
        new NotFoundException('Assignment not found'),
      );

      await expect(
        controller.removeUser('location-123', 'invalid-user'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
