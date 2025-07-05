import { IsOptional, IsString, ValidateNested, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum FileCategory {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  DAMAGE_REPORT = 'damage_report',
  VEHICLE_PHOTO = 'vehicle_photo',
  WASH_RESULT = 'wash_result',
  OTHER = 'other',
}

export class FileMetadataDto {
  @ApiPropertyOptional({ 
    description: 'File category',
    enum: FileCategory,
    example: FileCategory.INVOICE
  })
  @IsOptional()
  @IsEnum(FileCategory)
  category?: FileCategory;

  @ApiPropertyOptional({ 
    description: 'Related entity type',
    example: 'wash-task'
  })
  @IsOptional()
  @IsString()
  related_entity?: string;

  @ApiPropertyOptional({ 
    description: 'Related entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  entity_id?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { custom_field: 'value' }
  })
  @IsOptional()
  @IsObject()
  additional?: Record<string, any>;
}

export class FileUploadDto {
  @ApiProperty({
    description: 'File to upload',
    type: 'string',
    format: 'binary',
  })
  file: any;

  @ApiPropertyOptional({ 
    description: 'Custom path within the tenant bucket',
    example: 'documents/2024/invoices'
  })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiPropertyOptional({ 
    description: 'File metadata',
    type: FileMetadataDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FileMetadataDto)
  metadata?: FileMetadataDto;

  @ApiPropertyOptional({ 
    description: 'File description',
    example: 'Invoice for wash service on 2024-01-15'
  })
  @IsOptional()
  @IsString()
  description?: string;
}