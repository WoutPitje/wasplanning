import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiProperty({
    description: 'Display name for the tenant',
    example: 'Garage Amsterdam Noord',
    required: false,
  })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiProperty({
    description: 'Logo URL for the tenant',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({
    description: 'Whether the tenant is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Language preference for the tenant',
    example: 'nl',
    enum: ['nl', 'en'],
    required: false,
  })
  @IsOptional()
  @IsIn(['nl', 'en'])
  language?: string;

  @ApiProperty({
    description: 'Additional settings for the tenant',
    example: { theme: 'blue', language: 'nl' },
    required: false,
  })
  @IsOptional()
  settings?: Record<string, any>;
}