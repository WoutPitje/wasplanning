import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  OTHER = 'other',
}

export class FileQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by filename' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by file type',
    enum: FileType,
    example: FileType.DOCUMENT,
  })
  @IsOptional()
  @IsEnum(FileType)
  type?: FileType;

  @ApiPropertyOptional({ description: 'Filter by uploader user ID' })
  @IsOptional()
  @IsUUID()
  uploaded_by?: string;

  @ApiPropertyOptional({
    description: 'Filter by tenant ID (super admin only)',
  })
  @IsOptional()
  @IsUUID()
  tenant_id?: string;

  @ApiPropertyOptional({
    description: 'Filter files uploaded after this date',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional({
    description: 'Filter files uploaded before this date',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({
    description: 'Filter by metadata key-value pairs',
    example: '{"category":"invoice","related_entity":"wash-task"}',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    default: 'created_at',
    enum: ['created_at', 'filename', 'size', 'mimetype'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
