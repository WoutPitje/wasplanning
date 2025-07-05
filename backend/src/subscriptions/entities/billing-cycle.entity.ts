import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, Index } from 'typeorm';
import { Subscription } from './subscription.entity';

export enum BillingCycleStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  FAILED = 'failed',
}

@Entity('billing_cycles')
@Index('idx_billing_cycle_dates', ['subscriptionId', 'startDate', 'endDate'])
export class BillingCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Subscription, (subscription) => subscription.billingCycles, { nullable: false })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  // Charges
  @Column({ name: 'base_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseAmount: number;

  @Column({ name: 'usage_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  usageAmount: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  // Usage summary
  @Column({ name: 'usage_summary', type: 'jsonb', default: {} })
  usageSummary: Record<string, any>;

  // Billing status
  @Column({
    type: 'enum',
    enum: BillingCycleStatus,
    default: BillingCycleStatus.PENDING,
  })
  status: BillingCycleStatus;

  @Column({ name: 'invoice_id', length: 255, nullable: true })
  invoiceId: string;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}