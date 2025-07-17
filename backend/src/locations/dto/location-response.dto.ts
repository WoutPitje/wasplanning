import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
