import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Unique tenant identifier',
    example: 'garage-amsterdam-north',
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Display name for the tenant',
    example: 'Garage Amsterdam Noord',
  })
  @IsString()
  @MinLength(3)
  display_name: string;

  @ApiProperty({
    description: 'Logo URL for the tenant',
    example: 'https://example.com/logo.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  logo_url?: string;

  @ApiProperty({
    description: 'Email for the initial admin user',
    example: 'admin@garage-amsterdam.nl',
  })
  @IsEmail()
  admin_email: string;

  @ApiProperty({
    description: 'First name of the initial admin user',
    example: 'Jan',
  })
  @IsString()
  admin_first_name: string;

  @ApiProperty({
    description: 'Last name of the initial admin user',
    example: 'de Vries',
  })
  @IsString()
  admin_last_name: string;
}