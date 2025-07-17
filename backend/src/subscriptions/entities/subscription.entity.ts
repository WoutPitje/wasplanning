import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
}

@Entity('subscriptions')
@Unique(['tenant_id'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @OneToOne(() => Tenant, (tenant) => tenant.subscription)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column('uuid')
  plan_id: string;

  @ManyToOne(() => SubscriptionPlan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: SubscriptionPlan;

  @Column({ nullable: true, unique: true })
  @Index()
  stripe_subscription_id: string;

  @Column({ nullable: true })
  @Index()
  stripe_customer_id: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column('timestamp')
  current_period_start: Date;

  @Column('timestamp')
  current_period_end: Date;

  @Column({ default: false })
  cancel_at_period_end: boolean;

  @Column('timestamp', { nullable: true })
  canceled_at: Date;

  @Column('timestamp', { nullable: true })
  cancel_at: Date;

  @Column({ nullable: true })
  stripe_subscription_item_id: string;

  @Column({ nullable: true })
  payment_failed_at: Date;

  @Column({ default: 0 })
  payment_failure_count: number;

  @Column({ nullable: true })
  grace_period_end: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
