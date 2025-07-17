import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum WebhookEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('webhook_events')
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  stripe_event_id: string;

  @Column()
  type: string;

  @Column('jsonb')
  payload: any;

  @Column({
    type: 'enum',
    enum: WebhookEventStatus,
    default: WebhookEventStatus.PENDING,
  })
  status: WebhookEventStatus;

  @Column({ nullable: true })
  error_message: string;

  @Column({ default: 0 })
  retry_count: number;

  @Column({ nullable: true })
  processed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
