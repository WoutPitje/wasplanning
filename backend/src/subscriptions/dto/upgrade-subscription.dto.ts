import { IsUUID, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpgradeSubscriptionDto {
  @ApiProperty({
    description: 'Target subscription plan ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  plan_id: string;

  @ApiProperty({
    description: 'Payment method ID to use for the subscription',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  payment_method_id?: string;

  @ApiProperty({
    description:
      'Whether to apply changes immediately or at the end of the billing period. Must be false when downgrading to free plan.',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  immediate?: boolean;
}

export class UpgradeSubscriptionResponseDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  subscription_id: string;

  @ApiProperty({
    description: 'Stripe subscription ID',
    example: 'sub_1234567890',
  })
  stripe_subscription_id: string;

  @ApiProperty({
    description: 'New subscription status',
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Client secret for 3D Secure authentication if required',
    required: false,
    example: 'pi_1234567890_secret_abcdef',
  })
  client_secret?: string;

  @ApiProperty({
    description: 'Whether 3D Secure authentication is required',
    example: false,
  })
  requires_action: boolean;

  @ApiProperty({
    description: 'Amount charged (in cents)',
    example: 10000,
  })
  amount_charged: number;

  @ApiProperty({
    description: 'Proration amount if applicable (in cents)',
    example: 5000,
  })
  proration_amount?: number;

  @ApiProperty({
    description: 'Next billing date',
    example: '2024-02-01T00:00:00.000Z',
  })
  next_billing_date: Date;
}
