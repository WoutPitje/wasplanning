import { ApiProperty } from '@nestjs/swagger';
import { FileCategory } from '../entities/file.entity';

export class FileResponseDto {
  @ApiProperty({ description: 'File ID', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Tenant ID', format: 'uuid' })
  tenant_id: string;

  @ApiProperty({ description: 'Uploader user ID', format: 'uuid' })
  user_id: string;

  @ApiProperty({ 
    description: 'File category',
    enum: FileCategory
  })
  category: FileCategory;

  @ApiProperty({ description: 'Original filename' })
  original_filename: string;

  @ApiProperty({ description: 'Stored filename' })
  stored_filename: string;

  @ApiProperty({ description: 'MIME type' })
  mime_type: string;

  @ApiProperty({ description: 'File size in bytes' })
  size_bytes: number;

  @ApiProperty({ description: 'MinIO bucket name' })
  bucket_name: string;

  @ApiProperty({ description: 'Object key in MinIO' })
  object_key: string;

  @ApiProperty({ description: 'Whether file is publicly accessible' })
  is_public: boolean;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: Date;

  @ApiProperty({ description: 'Tenant information', required: false })
  tenant?: any;

  @ApiProperty({ description: 'User information', required: false })
  user?: any;
}

export class FileListResponseDto {
  @ApiProperty({ 
    description: 'List of files',
    type: [FileResponseDto]
  })
  files: FileResponseDto[];

  @ApiProperty({ description: 'Total number of files' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;
}