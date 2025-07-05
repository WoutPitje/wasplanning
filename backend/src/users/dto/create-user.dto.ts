import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../auth/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'jan.dewasser@garage.nl',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description:
      'User password. If not provided, a temporary password will be generated',
    example: 'SecurePassword123!',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'User first name', example: 'Jan' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'User last name', example: 'de Wasser' })
  @IsString()
  last_name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.WASSERS,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({
    description: 'Tenant ID the user belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  tenant_id: string;

  @ApiPropertyOptional({
    description: 'Whether the user is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
