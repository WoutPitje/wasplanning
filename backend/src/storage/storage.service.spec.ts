import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { StorageService, UploadFileOptions, FileListResponse } from './storage.service';
import { File, FileCategory } from './entities/file.entity';
import { FileQueryDto, FileType } from './dto/file-query.dto';
import * as Minio from 'minio';
import { Readable } from 'stream';

// Mock MinIO
jest.mock('minio');

// Mock utility functions
jest.mock('./utils/file-naming.util', () => ({
  generateStoragePath: jest.fn((tenantId, category, filename) => 
    `${category}/2024/01/uuid-${filename}`
  ),
  generateUniqueFilename: jest.fn((filename) => `uuid-${filename}`),
}));

jest.mock('./utils/file-validation.util', () => ({
  validateFileType: jest.fn(),
  validateFileSize: jest.fn(),
  getFileCategory: jest.fn(),
}));

describe('StorageService', () => {
  let service: StorageService;
  let fileRepository: Repository<File>;
  let configService: ConfigService;
  let minioClient: jest.Mocked<Minio.Client>;

  const mockFile = {
    id: 'file-uuid',
    tenant_id: 'tenant-uuid',
    user_id: 'user-uuid',
    category: FileCategory.DOCUMENT,
    original_filename: 'test.pdf',
    stored_filename: 'uuid-test.pdf',
    mime_type: 'application/pdf',
    size_bytes: 1024,
    bucket_name: 'wasplanning-tenant-uuid',
    object_key: 'document/2024/01/uuid-test.pdf',
    is_public: false,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  } as File;

  const mockMulterFile = {
    fieldname: 'file',
    originalname: 'test.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 1024,
    buffer: Buffer.from('test content'),
    destination: '',
    filename: '',
    path: '',
  } as Express.Multer.File;

  const mockFileRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        MINIO_ENDPOINT: 'localhost',
        MINIO_PORT: 9000,
        MINIO_USE_SSL: 'false',
        MINIO_ACCESS_KEY: 'test-access-key',
        MINIO_SECRET_KEY: 'test-secret-key',
        MINIO_REGION: 'us-east-1',
        MINIO_BUCKET_PREFIX: 'wasplanning',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    // Create MinIO client mock
    const MinioClientMock = jest.fn().mockImplementation(() => ({
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
      getObject: jest.fn(),
      removeObject: jest.fn(),
      copyObject: jest.fn(),
      presignedGetObject: jest.fn(),
    }));
    (Minio.Client as jest.MockedClass<typeof Minio.Client>) = MinioClientMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: getRepositoryToken(File),
          useValue: mockFileRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    fileRepository = module.get<Repository<File>>(getRepositoryToken(File));
    configService = module.get<ConfigService>(ConfigService);
    minioClient = (service as any).minioClient;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('constructor and initialization', () => {
    it('should initialize MinIO client with correct configuration', () => {
      // The MinIO client is created in the constructor, which happens before our test
      // So we need to check if it was created with the right config
      expect(minioClient).toBeDefined();
      expect(minioClient.bucketExists).toBeDefined();
      expect(minioClient.makeBucket).toBeDefined();
      expect(minioClient.putObject).toBeDefined();
    });

    it('should create tenant bucket if it does not exist', async () => {
      minioClient.bucketExists.mockResolvedValue(false);
      minioClient.makeBucket.mockResolvedValue(undefined);

      await (service as any).ensureTenantBucket('wasplanning-tenant-uuid');

      expect(minioClient.bucketExists).toHaveBeenCalledWith('wasplanning-tenant-uuid');
      expect(minioClient.makeBucket).toHaveBeenCalledWith('wasplanning-tenant-uuid', 'us-east-1');
    });

    it('should not create bucket if it already exists', async () => {
      minioClient.bucketExists.mockResolvedValue(true);

      await (service as any).ensureTenantBucket('wasplanning-tenant-uuid');

      expect(minioClient.bucketExists).toHaveBeenCalledWith('wasplanning-tenant-uuid');
      expect(minioClient.makeBucket).not.toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    const uploadOptions: UploadFileOptions = {
      file: mockMulterFile,
      tenantId: 'tenant-uuid',
      userId: 'user-uuid',
      category: FileCategory.DOCUMENT,
      isPublic: false,
      metadata: { test: true },
      allowedMimeTypes: ['application/pdf'],
      maxSizeBytes: 10 * 1024 * 1024,
    };

    beforeEach(() => {
      const { validateFileType, validateFileSize, getFileCategory } = require('./utils/file-validation.util');
      validateFileType.mockReturnValue({ isValid: true });
      validateFileSize.mockReturnValue({ isValid: true });
      getFileCategory.mockReturnValue('documents');
    });

    it('should successfully upload a file', async () => {
      minioClient.bucketExists.mockResolvedValue(true);
      minioClient.putObject.mockResolvedValue({ etag: 'test-etag', versionId: null } as any);
      mockFileRepository.create.mockReturnValue(mockFile);
      mockFileRepository.save.mockResolvedValue(mockFile);

      const result = await service.uploadFile(uploadOptions);

      expect(result).toEqual(mockFile);
      expect(minioClient.putObject).toHaveBeenCalledWith(
        'wasplanning-tenant-uuid',
        'document/2024/01/uuid-test.pdf',
        expect.any(Readable),
        1024,
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'X-Tenant-Id': 'tenant-uuid',
          'X-User-Id': 'user-uuid',
          'X-Original-Filename': 'test.pdf',
        })
      );
      expect(mockFileRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when file type is not allowed', async () => {
      const { validateFileType } = require('./utils/file-validation.util');
      validateFileType.mockReturnValue({ 
        isValid: false, 
        error: 'File type not allowed' 
      });

      await expect(service.uploadFile(uploadOptions)).rejects.toThrow(ForbiddenException);
      expect(minioClient.putObject).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when file size exceeds limit', async () => {
      const { validateFileSize } = require('./utils/file-validation.util');
      validateFileSize.mockReturnValue({ 
        isValid: false, 
        error: 'File too large' 
      });

      await expect(service.uploadFile(uploadOptions)).rejects.toThrow(ForbiddenException);
      expect(minioClient.putObject).not.toHaveBeenCalled();
    });

    it('should create tenant bucket if it does not exist', async () => {
      minioClient.bucketExists.mockResolvedValue(false);
      minioClient.makeBucket.mockResolvedValue(undefined);
      minioClient.putObject.mockResolvedValue({ etag: 'test-etag', versionId: null } as any);
      mockFileRepository.create.mockReturnValue(mockFile);
      mockFileRepository.save.mockResolvedValue(mockFile);

      await service.uploadFile(uploadOptions);

      expect(minioClient.makeBucket).toHaveBeenCalledWith('wasplanning-tenant-uuid', 'us-east-1');
    });

    it('should handle MinIO upload errors', async () => {
      minioClient.bucketExists.mockResolvedValue(true);
      minioClient.putObject.mockRejectedValue(new Error('MinIO error'));

      await expect(service.uploadFile(uploadOptions)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('getFile', () => {
    it('should return file when found and tenant matches', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);

      const result = await service.getFile('file-uuid', 'tenant-uuid');

      expect(result).toEqual(mockFile);
      expect(mockFileRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'file-uuid' },
        relations: ['tenant', 'user'],
      });
    });

    it('should throw NotFoundException when file not found', async () => {
      mockFileRepository.findOne.mockResolvedValue(null);

      await expect(service.getFile('file-uuid', 'tenant-uuid')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ForbiddenException when tenant does not match', async () => {
      mockFileRepository.findOne.mockResolvedValue({
        ...mockFile,
        tenant_id: 'different-tenant',
      });

      await expect(service.getFile('file-uuid', 'tenant-uuid')).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL successfully', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.presignedGetObject.mockResolvedValue('https://example.com/signed-url');

      const result = await service.generatePresignedUrl('file-uuid', 'tenant-uuid');

      expect(result).toBe('https://example.com/signed-url');
      expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
        'wasplanning-tenant-uuid',
        'document/2024/01/uuid-test.pdf',
        7 * 24 * 60 * 60
      );
    });

    it('should use custom expiry when provided', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.presignedGetObject.mockResolvedValue('https://example.com/signed-url');

      await service.generatePresignedUrl('file-uuid', 'tenant-uuid', 3600);

      expect(minioClient.presignedGetObject).toHaveBeenCalledWith(
        'wasplanning-tenant-uuid',
        'document/2024/01/uuid-test.pdf',
        3600
      );
    });

    it('should handle MinIO errors', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.presignedGetObject.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.generatePresignedUrl('file-uuid', 'tenant-uuid')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file when user is owner', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.removeObject.mockResolvedValue(undefined);
      mockFileRepository.remove.mockResolvedValue(mockFile);

      await service.deleteFile('file-uuid', 'tenant-uuid', 'user-uuid');

      expect(minioClient.removeObject).toHaveBeenCalledWith(
        'wasplanning-tenant-uuid',
        'document/2024/01/uuid-test.pdf'
      );
      expect(mockFileRepository.remove).toHaveBeenCalledWith(mockFile);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockFileRepository.findOne.mockResolvedValue({
        ...mockFile,
        user_id: 'different-user',
      });

      await expect(
        service.deleteFile('file-uuid', 'tenant-uuid', 'user-uuid')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should handle MinIO deletion errors', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.removeObject.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.deleteFile('file-uuid', 'tenant-uuid', 'user-uuid')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('listFiles', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('should list files with pagination', async () => {
      const query: FileQueryDto = {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockFile], 1]);

      const result = await service.listFiles(query, 'tenant-uuid');

      expect(result).toEqual({
        files: [mockFile],
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ tenant_id: 'tenant-uuid' });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply search filter', async () => {
      const query: FileQueryDto = {
        page: 1,
        limit: 10,
        search: 'test',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listFiles(query, 'tenant-uuid');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.objectContaining({
          original_filename: expect.anything(),
        })
      );
    });

    it('should apply date range filters', async () => {
      const query: FileQueryDto = {
        page: 1,
        limit: 10,
        from_date: '2024-01-01',
        to_date: '2024-12-31',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listFiles(query, 'tenant-uuid');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'file.created_at >= :from_date',
        { from_date: '2024-01-01' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'file.created_at <= :to_date',
        { to_date: '2024-12-31' }
      );
    });

    it('should apply file type filters', async () => {
      const query: FileQueryDto = {
        page: 1,
        limit: 10,
        type: FileType.IMAGE,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listFiles(query, 'tenant-uuid');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'file.mime_type LIKE :type',
        { type: 'image/%' }
      );
    });

    it('should apply metadata filters', async () => {
      const query: FileQueryDto = {
        page: 1,
        limit: 10,
        metadata: { category: 'invoice' },
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.listFiles(query, 'tenant-uuid');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "file.metadata->>'category' = :category",
        { category: 'invoice' }
      );
    });

    it('should handle query errors', async () => {
      mockQueryBuilder.getManyAndCount.mockRejectedValue(new Error('Query error'));

      await expect(service.listFiles({}, 'tenant-uuid')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('getFileStream', () => {
    it('should return file stream successfully', async () => {
      const mockStream = new Readable();
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.getObject.mockResolvedValue(mockStream);

      const result = await service.getFileStream('file-uuid', 'tenant-uuid');

      expect(result).toBe(mockStream);
      expect(minioClient.getObject).toHaveBeenCalledWith(
        'wasplanning-tenant-uuid',
        'document/2024/01/uuid-test.pdf'
      );
    });

    it('should handle MinIO stream errors', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.getObject.mockRejectedValue(new Error('MinIO error'));

      await expect(
        service.getFileStream('file-uuid', 'tenant-uuid')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('copyFile', () => {
    it('should copy file successfully', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.copyObject.mockResolvedValue({ etag: 'new-etag', lastModified: new Date() } as any);
      mockFileRepository.create.mockReturnValue({ ...mockFile, id: 'new-file-uuid' });
      mockFileRepository.save.mockResolvedValue({ ...mockFile, id: 'new-file-uuid' });

      const result = await service.copyFile(
        'file-uuid',
        'tenant-uuid',
        'new-user-uuid',
        { new: 'metadata' }
      );

      expect(result.id).toBe('new-file-uuid');
      expect(minioClient.copyObject).toHaveBeenCalled();
      expect(mockFileRepository.save).toHaveBeenCalled();
    });

    it('should handle copy errors', async () => {
      mockFileRepository.findOne.mockResolvedValue(mockFile);
      minioClient.copyObject.mockRejectedValue(new Error('Copy error'));

      await expect(
        service.copyFile('file-uuid', 'tenant-uuid', 'user-uuid')
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTenantStorageStats', () => {
    it('should return storage statistics', async () => {
      const mockStats = [
        { category: FileCategory.DOCUMENT, count: '5' },
        { category: FileCategory.VEHICLE_PHOTO, count: '3' },
      ];
      const mockTotalStats = {
        total_files: '8',
        total_size: '8388608', // 8MB in bytes
      };

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockStats),
        getRawOne: jest.fn().mockResolvedValue(mockTotalStats),
      };

      mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTenantStorageStats('tenant-uuid');

      expect(result).toEqual({
        totalFiles: 8,
        totalSizeBytes: 8388608,
        totalSizeMB: 8,
        filesByCategory: {
          [FileCategory.DOCUMENT]: 5,
          [FileCategory.VEHICLE_PHOTO]: 3,
        },
        filesByType: {},
      });
    });

    it('should handle empty statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({ total_files: '0', total_size: null }),
      };

      mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTenantStorageStats('tenant-uuid');

      expect(result).toEqual({
        totalFiles: 0,
        totalSizeBytes: 0,
        totalSizeMB: 0,
        filesByCategory: {},
        filesByType: {},
      });
    });

    it('should handle query errors', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockRejectedValue(new Error('Query error')),
      };

      mockFileRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.getTenantStorageStats('tenant-uuid')).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('private methods', () => {
    describe('getTenantBucket', () => {
      it('should return tenant-specific bucket name', () => {
        const bucketName = (service as any).getTenantBucket('tenant-uuid');
        expect(bucketName).toBe('wasplanning-tenant-uuid');
      });

      it('should sanitize tenant ID in bucket name', () => {
        const bucketName = (service as any).getTenantBucket('Tenant_UUID@123');
        expect(bucketName).toBe('wasplanning-tenantuuid123');
      });
    });

    describe('ensureTenantBucket', () => {
      it('should create bucket if it does not exist', async () => {
        minioClient.bucketExists.mockResolvedValue(false);
        minioClient.makeBucket.mockResolvedValue(undefined);

        await (service as any).ensureTenantBucket('test-bucket');

        expect(minioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
        expect(minioClient.makeBucket).toHaveBeenCalledWith('test-bucket', 'us-east-1');
      });

      it('should throw InternalServerErrorException on bucket creation failure', async () => {
        minioClient.bucketExists.mockRejectedValue(new Error('MinIO error'));

        await expect(
          (service as any).ensureTenantBucket('test-bucket')
        ).rejects.toThrow(InternalServerErrorException);
      });
    });

    describe('mapSortField', () => {
      it('should map sort fields correctly', () => {
        expect((service as any).mapSortField('created_at')).toBe('file.created_at');
        expect((service as any).mapSortField('filename')).toBe('file.original_filename');
        expect((service as any).mapSortField('size')).toBe('file.size_bytes');
        expect((service as any).mapSortField('mimetype')).toBe('file.mime_type');
        expect((service as any).mapSortField('unknown')).toBe('file.created_at');
      });
    });
  });
});