import { ApiProperty } from '@nestjs/swagger';
import {
  PaymentMethodType,
  CardBrand,
} from '../entities/payment-method.entity';

export class PaymentMethodResponseDto {
  @ApiProperty({
    description: 'Payment method ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Payment method type',
    enum: PaymentMethodType,
    example: PaymentMethodType.CARD,
  })
  type: PaymentMethodType;

  @ApiProperty({
    description: 'Whether this is the default payment method',
    example: true,
  })
  is_default: boolean;

  // Card specific fields
  @ApiProperty({
    description: 'Card brand',
    enum: CardBrand,
    required: false,
    example: CardBrand.VISA,
  })
  card_brand?: CardBrand;

  @ApiProperty({
    description: 'Last 4 digits of card',
    required: false,
    example: '4242',
  })
  card_last4?: string;

  @ApiProperty({
    description: 'Card expiration month',
    required: false,
    example: 12,
  })
  card_exp_month?: number;

  @ApiProperty({
    description: 'Card expiration year',
    required: false,
    example: 2025,
  })
  card_exp_year?: number;

  // Bank account fields
  @ApiProperty({
    description: 'Bank name',
    required: false,
    example: 'ING',
  })
  bank_name?: string;

  @ApiProperty({
    description: 'Last 4 digits of bank account',
    required: false,
    example: '1234',
  })
  bank_last4?: string;

  // Billing details
  @ApiProperty({
    description: 'Billing name',
    required: false,
    example: 'Jan de Vries',
  })
  billing_name?: string;

  @ApiProperty({
    description: 'Billing email',
    required: false,
    example: 'jan@garage.nl',
  })
  billing_email?: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Display string for UI',
    example: 'Visa •••• 4242',
  })
  display_string: string;
}
