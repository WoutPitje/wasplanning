import { IsEnum, IsNumber, IsPositive, IsOptional, IsObject } from 'class-validator';
import { MetricType } from '../entities/usage-record.entity';

export class RecordUsageDto {
  @IsEnum(MetricType)
  metricType: MetricType;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}