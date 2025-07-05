import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from '../../auth/entities/user.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SortDto } from '../../common/dto/sort.dto';

export class GetUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    enum: UserRole, 
    description: 'Filter by role',
    example: UserRole.WERKPLAATS
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by tenant ID (super admin only)' })
  @IsOptional()
  @IsUUID()
  tenant?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ 
    description: 'Field to sort by',
    default: 'created_at',
    enum: ['created_at', 'email', 'first_name', 'last_name', 'last_login']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiPropertyOptional({ 
    description: 'Sort order', 
    enum: ['ASC', 'DESC'],
    default: 'DESC' 
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}