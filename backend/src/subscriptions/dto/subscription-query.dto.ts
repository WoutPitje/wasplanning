import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { SubscriptionStatus } from '../entities/subscription.entity';

export class SubscriptionQueryDto {
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}