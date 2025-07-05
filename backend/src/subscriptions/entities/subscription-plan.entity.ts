import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subscription } from './subscription.entity';

export enum BillingType {
  SUBSCRIPTION = 'subscription',
  USAGE_BASED = 'usage_based',
  HYBRID = 'hybrid',
}

export enum PlanName {
  STARTER = 'starter',
  GROEI = 'groei',
  ENTERPRISE = 'enterprise',
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PlanName,
    unique: true,
  })
  name: PlanName;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2 })
  priceMonthly: number;

  @Column({ name: 'price_yearly', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceYearly: number;

  @Column({
    name: 'billing_type',
    type: 'enum',
    enum: BillingType,
  })
  billingType: BillingType;

  // Limits (NULL = unlimited)
  @Column({ name: 'max_locations', type: 'integer', nullable: true })
  maxLocations: number;

  @Column({ name: 'max_cars_per_month', type: 'integer', nullable: true })
  maxCarsPerMonth: number;

  @Column({ name: 'max_users', type: 'integer', nullable: true })
  maxUsers: number;

  // Features
  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  // Overage pricing (for hybrid model)
  @Column({ name: 'overage_price_per_car', type: 'decimal', precision: 10, scale: 2, nullable: true })
  overagePricePerCar: number;

  @Column({ name: 'overage_price_per_location', type: 'decimal', precision: 10, scale: 2, nullable: true })
  overagePricePerLocation: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (subscription) => subscription.plan)
  subscriptions: Subscription[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}