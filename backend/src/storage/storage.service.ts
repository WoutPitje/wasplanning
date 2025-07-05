import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, Logger } from '@nestjs/common';
import { getErrorMessage, getErrorStack } from '../common/utils/error.util';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import * as Minio from 'minio';
import { File, FileCategory } from './entities/file.entity';
import { FileQueryDto } from './dto/file-query.dto';
import { generateStoragePath, generateUniqueFilename } from './utils/file-naming.util';
import { validateFileSize, validateFileType, getFileCategory } from './utils/file-validation.util';
import { Readable } from 'stream';

export interface UploadFileOptions {
  file: Express.Multer.File;
  tenantId: string;
  userId: string;
  category?: FileCategory;
  isPublic?: boolean;
  metadata?: Record<string, any>;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

export interface FileListResponse {
  files: File[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client;
  private readonly bucketPrefix: string;
  private readonly presignedUrlExpiry: number = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(
    private configService: ConfigService,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
  ) {
    // Validate required MinIO configuration
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    
    if (!accessKey || !secretKey) {
      throw new Error('MinIO credentials (MINIO_ACCESS_KEY, MINIO_SECRET_KEY) are required');
    }

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: this.configService.get<number>('MINIO_PORT', 9000),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey,
      secretKey,
      region: this.configService.get<string>('MINIO_REGION', 'us-east-1'),
    });

    this.bucketPrefix = this.configService.get<string>('MINIO_BUCKET_PREFIX', 'wasplanning');
  }

  /**
   * Generate tenant-specific bucket name
   */
  private getTenantBucket(tenantId: string): string {
    // Sanitize tenant ID for bucket name (MinIO bucket names must be lowercase, no special chars)
    const sanitizedTenantId = tenantId.toLowerCase().replace(/[^a-z0-9-]/g, '');
    return `${this.bucketPrefix}-${sanitizedTenantId}`;
  }

  /**
   * Ensure tenant bucket exists, create if not
   */
  private async ensureTenantBucket(bucketName: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, this.configService.get<string>('MINIO_REGION', 'us-east-1'));
        this.logger.log(`Created MinIO bucket: ${bucketName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create bucket ${bucketName}: ${getErrorMessage(error)}`);
      throw new InternalServerErrorException(`Failed to create storage bucket`);
    }
  }

  /**
   * Upload file to MinIO with tenant isolation
   */
  async uploadFile(options: UploadFileOptions): Promise<File> {
    const { 
      file, 
      tenantId, 
      userId, 
      category = FileCategory.OTHER,
      isPublic = false,
      metadata = {},
      allowedMimeTypes = [],
      maxSizeBytes = 10 * 1024 * 1024 // 10MB default
    } = options;

    try {
      // Validate file type if restrictions are provided
      if (allowedMimeTypes.length > 0) {
        const typeValidation = validateFileType(file.mimetype, allowedMimeTypes);
        if (!typeValidation.isValid) {
          throw new ForbiddenException(typeValidation.error);
        }
      }

      // Validate file size
      const sizeValidation = validateFileSize(file.size, maxSizeBytes);
      if (!sizeValidation.isValid) {
        throw new ForbiddenException(sizeValidation.error);
      }

      // Generate storage path with tenant isolation
      const storagePath = generateStoragePath(tenantId, category, file.originalname);
      const bucketName = this.getTenantBucket(tenantId);

      // Ensure tenant bucket exists
      await this.ensureTenantBucket(bucketName);

      // Upload to MinIO
      const stream = Readable.from(file.buffer);
      await this.minioClient.putObject(
        bucketName,
        storagePath,
        stream,
        file.size,
        {
          'Content-Type': file.mimetype,
          'X-Tenant-Id': tenantId,
          'X-User-Id': userId,
          'X-Original-Filename': file.originalname,
        }
      );

      // Save file metadata to database
      const fileRecord = this.fileRepository.create({
        tenant_id: tenantId,
        user_id: userId,
        category,
        original_filename: file.originalname,
        stored_filename: storagePath.split('/').pop(),
        mime_type: file.mimetype,
        size_bytes: file.size,
        bucket_name: bucketName,
        object_key: storagePath,
        is_public: isPublic,
        metadata: {
          ...metadata,
          upload_timestamp: new Date().toISOString(),
          file_category: getFileCategory(file.mimetype),
        },
      });

      const savedFile = await this.fileRepository.save(fileRecord);
      this.logger.log(`File uploaded successfully: ${savedFile.id} for tenant ${tenantId}`);

      return savedFile;
    } catch (error) {
      this.logger.error(`File upload failed: ${getErrorMessage(error)}`, getErrorStack(error));
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  /**
   * Get file metadata from database
   */
  async getFile(fileId: string, tenantId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
      relations: ['tenant', 'user'],
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Ensure tenant isolation
    if (file.tenant_id !== tenantId) {
      throw new ForbiddenException('Access denied to this file');
    }

    return file;
  }

  /**
   * Generate presigned URL for file download
   */
  async generatePresignedUrl(fileId: string, tenantId: string, expiry?: number): Promise<string> {
    const file = await this.getFile(fileId, tenantId);

    try {
      const url = await this.minioClient.presignedGetObject(
        file.bucket_name,
        file.object_key,
        expiry || this.presignedUrlExpiry,
      );

      return url;
    } catch (error) {
      this.logger.error(`Failed to generate presigned URL: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  /**
   * Delete file from MinIO and database
   */
  async deleteFile(fileId: string, tenantId: string, userId: string): Promise<void> {
    const file = await this.getFile(fileId, tenantId);

    // Check if user has permission to delete (owner or admin)
    if (file.user_id !== userId) {
      // Here you might want to check if the user is an admin
      throw new ForbiddenException('You can only delete your own files');
    }

    try {
      // Delete from MinIO
      await this.minioClient.removeObject(file.bucket_name, file.object_key);

      // Delete from database
      await this.fileRepository.remove(file);

      this.logger.log(`File deleted successfully: ${fileId} for tenant ${tenantId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  /**
   * List files with pagination and filters
   */
  async listFiles(query: FileQueryDto, tenantId: string): Promise<FileListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      uploaded_by,
      tenant_id,
      from_date,
      to_date,
      metadata,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = query;

    try {
      const where: FindOptionsWhere<File> = {
        tenant_id: tenantId, // Always filter by tenant unless super admin
      };

      // Super admin can filter by specific tenant
      if (tenant_id) {
        // This should be validated in controller to ensure only super admins can use this
        where.tenant_id = tenant_id;
      }

      // Search by filename
      if (search) {
        where.original_filename = ILike(`%${search}%`);
      }

      // Filter by uploader
      if (uploaded_by) {
        where.user_id = uploaded_by;
      }

      // Build query
      const queryBuilder = this.fileRepository.createQueryBuilder('file')
        .leftJoinAndSelect('file.tenant', 'tenant')
        .leftJoinAndSelect('file.user', 'user')
        .where(where);

      // Date range filters
      if (from_date) {
        queryBuilder.andWhere('file.created_at >= :from_date', { from_date });
      }
      if (to_date) {
        queryBuilder.andWhere('file.created_at <= :to_date', { to_date });
      }

      // File type filter based on mime type
      if (type) {
        switch (type) {
          case 'image':
            queryBuilder.andWhere('file.mime_type LIKE :type', { type: 'image/%' });
            break;
          case 'document':
            queryBuilder.andWhere('file.mime_type IN (:...types)', {
              types: [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
              ],
            });
            break;
          case 'video':
            queryBuilder.andWhere('file.mime_type LIKE :type', { type: 'video/%' });
            break;
          default:
            queryBuilder.andWhere('file.mime_type NOT LIKE ALL(ARRAY[:...excludeTypes])', {
              excludeTypes: ['image/%', 'video/%', 'application/pdf', 'application/msword'],
            });
        }
      }

      // Metadata filter (JSONB query)
      if (metadata && Object.keys(metadata).length > 0) {
        Object.entries(metadata).forEach(([key, value]) => {
          queryBuilder.andWhere(`file.metadata->>'${key}' = :${key}`, { [key]: value });
        });
      }

      // Sorting
      const sortField = this.mapSortField(sortBy);
      queryBuilder.orderBy(sortField, sortOrder);

      // Pagination
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      // Execute query
      const [files, total] = await queryBuilder.getManyAndCount();

      return {
        files,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to list files: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to list files');
    }
  }


  /**
   * Map sort field to database column
   */
  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      'created_at': 'file.created_at',
      'filename': 'file.original_filename',
      'size': 'file.size_bytes',
      'mimetype': 'file.mime_type',
    };
    return fieldMap[field] || 'file.created_at';
  }

  /**
   * Get file stream from MinIO
   */
  async getFileStream(fileId: string, tenantId: string): Promise<Readable> {
    const file = await this.getFile(fileId, tenantId);

    try {
      const stream = await this.minioClient.getObject(file.bucket_name, file.object_key);
      return stream;
    } catch (error) {
      this.logger.error(`Failed to get file stream: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to retrieve file');
    }
  }

  /**
   * Copy file within same tenant
   */
  async copyFile(fileId: string, tenantId: string, userId: string, newMetadata?: Record<string, any>): Promise<File> {
    const sourceFile = await this.getFile(fileId, tenantId);

    try {
      // Generate new storage path
      const newStoragePath = generateStoragePath(tenantId, sourceFile.category, sourceFile.original_filename);

      // Copy in MinIO
      await this.minioClient.copyObject(
        sourceFile.bucket_name,
        newStoragePath,
        `/${sourceFile.bucket_name}/${sourceFile.object_key}`,
      );

      // Create new file record
      const newFile = this.fileRepository.create({
        ...sourceFile,
        id: undefined, // Let database generate new ID
        user_id: userId,
        object_key: newStoragePath,
        stored_filename: newStoragePath.split('/').pop(),
        metadata: {
          ...sourceFile.metadata,
          ...newMetadata,
          copied_from: fileId,
          copy_timestamp: new Date().toISOString(),
        },
        created_at: undefined,
        updated_at: undefined,
      });

      const savedFile = await this.fileRepository.save(newFile);
      this.logger.log(`File copied successfully: ${fileId} -> ${savedFile.id}`);

      return savedFile;
    } catch (error) {
      this.logger.error(`Failed to copy file: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to copy file');
    }
  }

  /**
   * Get storage statistics for a tenant
   */
  async getTenantStorageStats(tenantId: string): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    totalSizeMB: number;
    filesByCategory: Record<string, number>;
    filesByType: Record<string, number>;
  }> {
    try {
      const stats = await this.fileRepository
        .createQueryBuilder('file')
        .select('COUNT(*)', 'total_files')
        .addSelect('SUM(file.size_bytes)', 'total_size')
        .addSelect('file.category', 'category')
        .addSelect('COUNT(*)', 'count')
        .where('file.tenant_id = :tenantId', { tenantId })
        .groupBy('file.category')
        .getRawMany();

      const totalStats = await this.fileRepository
        .createQueryBuilder('file')
        .select('COUNT(*)', 'total_files')
        .addSelect('COALESCE(SUM(file.size_bytes), 0)', 'total_size')
        .where('file.tenant_id = :tenantId', { tenantId })
        .getRawOne();

      const filesByCategory = stats.reduce((acc, stat) => {
        acc[stat.category] = parseInt(stat.count);
        return acc;
      }, {});

      return {
        totalFiles: parseInt(totalStats.total_files) || 0,
        totalSizeBytes: parseInt(totalStats.total_size) || 0,
        totalSizeMB: Math.round((parseInt(totalStats.total_size) || 0) / (1024 * 1024) * 100) / 100,
        filesByCategory,
        filesByType: {}, // Can be implemented similarly based on mime types
      };
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${getErrorMessage(error)}`, getErrorStack(error));
      throw new InternalServerErrorException('Failed to get storage statistics');
    }
  }
}