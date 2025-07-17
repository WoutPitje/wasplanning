import { ApiProperty } from '@nestjs/swagger';

export class UsageItemDto {
  @ApiProperty({
    description: 'Current usage count',
    example: 750,
  })
  current: number;

  @ApiProperty({
    description: 'Usage limit (null = unlimited)',
    example: 1500,
    nullable: true,
  })
  limit: number | null;

  @ApiProperty({
    description: 'Remaining quota',
    example: 750,
    nullable: true,
  })
  remaining: number | null;

  @ApiProperty({
    description: 'Usage percentage',
    example: 50,
  })
  percentage: number;

  @ApiProperty({
    description: 'Whether approaching limit (80% or more)',
    example: false,
  })
  is_approaching_limit: boolean;

  @ApiProperty({
    description: 'Whether at limit',
    example: false,
  })
  is_at_limit: boolean;
}

export class UsageResponseDto {
  @ApiProperty({
    description: 'Current billing period start',
    example: '2024-01-01T00:00:00.000Z',
  })
  period_start: Date;

  @ApiProperty({
    description: 'Current billing period end',
    example: '2024-01-31T23:59:59.999Z',
  })
  period_end: Date;

  @ApiProperty({
    description: 'Days remaining in period',
    example: 15,
  })
  days_remaining: number;

  @ApiProperty({
    description: 'Cars washed usage',
    type: UsageItemDto,
  })
  cars_washed: UsageItemDto;

  @ApiProperty({
    description: 'Active users usage',
    type: UsageItemDto,
  })
  active_users: UsageItemDto;

  @ApiProperty({
    description: 'Locations usage',
    type: UsageItemDto,
  })
  locations: UsageItemDto;

  @ApiProperty({
    description: 'Summary of items at or approaching limits',
    example: {
      at_limit: [],
      approaching_limit: ['active_users'],
    },
  })
  summary: {
    at_limit: string[];
    approaching_limit: string[];
  };
}
