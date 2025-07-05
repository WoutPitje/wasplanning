import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsObject } from 'class-validator';

export class ProcessPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string = 'EUR';

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}