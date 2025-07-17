import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty({ description: 'Location name', minLength: 2, maxLength: 255 })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Location address', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
