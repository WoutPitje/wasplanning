import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty({
    description: 'Plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Plan name (internal)',
    example: 'standard',
  })
  name: string;

  @ApiProperty({
    description: 'Plan display name',
    example: 'Standaard',
  })
  display_name: string;

  @ApiProperty({
    description: 'Price in cents',
    example: 10000,
  })
  price_cents: number;

  @ApiProperty({
    description: 'Price in euros',
    example: 100.0,
  })
  price_euros: number;

  @ApiProperty({
    description: 'Monthly price display',
    example: '€100,00/maand',
  })
  price_display: string;

  @ApiProperty({
    description: 'Maximum cars per month (null = unlimited)',
    example: 1500,
    nullable: true,
  })
  max_cars_per_month: number | null;

  @ApiProperty({
    description: 'Maximum active users (null = unlimited)',
    example: 10,
    nullable: true,
  })
  max_active_users: number | null;

  @ApiProperty({
    description: 'Maximum locations (null = unlimited)',
    example: 3,
    nullable: true,
  })
  max_locations: number | null;

  @ApiProperty({
    description: 'Plan features',
    example: {
      api_access: true,
      advanced_reporting: true,
      custom_branding: false,
      priority_support: false,
      export_data: true,
      multi_location: true,
    },
  })
  features: {
    api_access: boolean;
    advanced_reporting: boolean;
    custom_branding: boolean;
    priority_support: boolean;
    export_data: boolean;
    multi_location: boolean;
  };

  @ApiProperty({
    description: 'Whether this is the current plan',
    example: false,
  })
  is_current: boolean;

  @ApiProperty({
    description: 'Whether this plan is recommended',
    example: true,
  })
  is_recommended: boolean;
}
