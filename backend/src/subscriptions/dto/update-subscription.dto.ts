import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { PlanName } from '../entities/subscription-plan.entity';
import { BillingInterval } from '../entities/subscription.entity';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(PlanName)
  planName?: PlanName;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @IsOptional()
  @IsEnum(BillingInterval)
  billingInterval?: BillingInterval;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}