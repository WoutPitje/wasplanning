import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe payment method ID from frontend',
    example: 'pm_1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  payment_method_id: string;
}
