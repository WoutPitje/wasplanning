import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export interface PlanFeatures {
  api_access: boolean;
  advanced_reporting: boolean;
  custom_branding: boolean;
  priority_support: boolean;
  export_data: boolean;
  multi_location: boolean;
}

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  name: string; // 'free', 'standard', 'enterprise'

  @Column()
  display_name: string; // 'Gratis', 'Standaard', 'Enterprise'

  @Column('int')
  price_cents: number; // 0, 10000, 40000

  @Column({ nullable: true })
  stripe_price_id: string; // null for free tier

  @Column('int', { nullable: true })
  max_cars_per_month: number; // null = unlimited

  @Column('int', { nullable: true })
  max_active_users: number;

  @Column('int', { nullable: true })
  max_locations: number;

  @Column('jsonb')
  features: PlanFeatures;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
