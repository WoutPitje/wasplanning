import { ApiProperty } from '@nestjs/swagger';

export class CreateSetupIntentResponseDto {
  @ApiProperty({
    description: 'Client secret for Stripe Elements',
    example: 'seti_1234567890_secret_abcdefghijklmnop',
  })
  client_secret: string;

  @ApiProperty({
    description: 'Supported payment method types',
    example: ['card', 'ideal', 'sepa_debit'],
    type: [String],
  })
  payment_method_types: string[];
}
