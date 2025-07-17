import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export enum UsageType {
  CARS_WASHED = 'cars_washed',
  ACTIVE_USERS = 'active_users',
  LOCATIONS = 'locations',
}

@Entity('usage_records')
@Unique(['tenant_id', 'record_type', 'period_start'])
@Index(['tenant_id', 'period_start'])
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column({
    type: 'enum',
    enum: UsageType,
  })
  record_type: UsageType;

  @Column('date')
  period_start: Date;

  @Column('date')
  period_end: Date;

  @Column('int', { default: 0 })
  count: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
