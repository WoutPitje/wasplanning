import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Index } from 'typeorm';
import { Subscription } from './subscription.entity';
import { BillingCycle } from './billing-cycle.entity';

export enum MetricType {
  CARS_WASHED = 'cars_washed',
  ACTIVE_USERS = 'active_users',
  ACTIVE_LOCATIONS = 'active_locations',
}

@Entity('usage_records')
@Index('idx_usage_subscription_metric', ['subscriptionId', 'metricType', 'recordedAt'])
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.usageRecords, { nullable: false })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @ManyToOne(() => BillingCycle, { nullable: true })
  @JoinColumn({ name: 'billing_cycle_id' })
  billingCycle: BillingCycle;

  @Column({ name: 'billing_cycle_id', nullable: true })
  billingCycleId: string;

  @Column({
    name: 'metric_type',
    type: 'enum',
    enum: MetricType,
  })
  metricType: MetricType;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 4, nullable: true })
  unitPrice: number;

  @Column({ name: 'recorded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;
}