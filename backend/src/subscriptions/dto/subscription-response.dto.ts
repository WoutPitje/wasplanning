import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenant_id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'standard',
  })
  plan_name: string;

  @ApiProperty({
    description: 'Plan display name',
    example: 'Standaard',
  })
  plan_display_name: string;

  @ApiProperty({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @ApiProperty({
    description: 'Current billing period start date',
    example: '2024-01-01T00:00:00.000Z',
  })
  current_period_start: Date;

  @ApiProperty({
    description: 'Current billing period end date',
    example: '2024-01-31T23:59:59.999Z',
  })
  current_period_end: Date;

  @ApiProperty({
    description: 'Days remaining in current period',
    example: 15,
  })
  days_remaining: number;

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
    description: 'Current usage statistics',
    example: {
      cars_washed: { current: 750, limit: 1500, percentage: 50 },
      active_users: { current: 5, limit: 10, percentage: 50 },
      locations: { current: 1, limit: 3, percentage: 33 },
    },
  })
  usage: {
    cars_washed: {
      current: number;
      limit: number | null;
      percentage: number;
    };
    active_users: {
      current: number;
      limit: number | null;
      percentage: number;
    };
    locations: {
      current: number;
      limit: number | null;
      percentage: number;
    };
  };

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
    description: 'Stripe customer ID',
    example: 'cus_1234567890',
    required: false,
  })
  stripe_customer_id?: string;

  @ApiProperty({
    description: 'Stripe subscription ID',
    example: 'sub_1234567890',
    required: false,
  })
  stripe_subscription_id?: string;

  @ApiProperty({
    description:
      'Whether the subscription is set to cancel at the end of the period',
    example: false,
  })
  cancel_at_period_end?: boolean;

  @ApiProperty({
    description: 'Date when the subscription will be canceled',
    required: false,
    example: '2024-02-01T00:00:00.000Z',
  })
  cancel_at?: Date;

  @ApiProperty({
    description: 'Date when the subscription was marked for cancellation',
    required: false,
    example: '2024-01-15T00:00:00.000Z',
  })
  canceled_at?: Date;
}
