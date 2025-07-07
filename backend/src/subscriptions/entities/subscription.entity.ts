import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { PaymentMethod } from '../../payments/entities/payment-method.entity';
import { UsageRecord } from './usage-record.entity';
import { BillingCycle } from './billing-cycle.entity';

export enum SubscriptionStatus {
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
}

export enum BillingInterval {
  MONTH = 'month',
  YEAR = 'year',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => SubscriptionPlan, (plan) => plan.subscriptions, { nullable: false })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_method_id', nullable: true })
  paymentMethodId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
  })
  status: SubscriptionStatus;

  // Billing cycle
  @Column({ name: 'current_period_start', type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end', type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({
    name: 'billing_interval',
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.MONTH,
  })
  billingInterval: BillingInterval;

  // Provider reference
  @Column({ length: 50, nullable: true })
  provider: string;

  @Column({ name: 'provider_subscription_id', length: 255, nullable: true })
  providerSubscriptionId: string;

  // Trial
  @Column({ name: 'trial_end', type: 'timestamp', nullable: true })
  trialEnd: Date;

  // Cancellation
  @Column({ name: 'canceled_at', type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  // Proration and credits
  @Column({ name: 'credit_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditBalance: number;

  @Column({ name: 'next_payment_date', type: 'timestamp', nullable: true })
  nextPaymentDate: Date;

  @Column({ name: 'mollie_customer_id', length: 255, nullable: true })
  mollieCustomerId: string;

  @Column({ name: 'mollie_mandate_id', length: 255, nullable: true })
  mollieMandateId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @OneToMany(() => UsageRecord, (usage) => usage.subscription)
  usageRecords: UsageRecord[];

  @OneToMany(() => BillingCycle, (cycle) => cycle.subscription)
  billingCycles: BillingCycle[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}