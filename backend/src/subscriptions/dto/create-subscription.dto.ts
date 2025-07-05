import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { PlanName } from '../entities/subscription-plan.entity';
import { BillingInterval } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsEnum(PlanName)
  planName: PlanName;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval = BillingInterval.MONTH;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}