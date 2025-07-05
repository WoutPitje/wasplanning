import { IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileCategory } from '../entities/file.entity';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'File to upload' })
  file: any;

  @ApiPropertyOptional({ 
    description: 'Category of the file',
    enum: FileCategory,
    default: FileCategory.OTHER
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ 
    description: 'Whether the file should be publicly accessible',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ 
    description: 'Additional metadata for the file',
    example: { description: 'Vehicle damage report', related_entity_id: 'uuid' }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}