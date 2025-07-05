import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('audit_logs')
@Index(['tenant_id', 'created_at'])
@Index(['user_id', 'created_at'])
@Index(['action', 'created_at'])
@Index(['resource_type', 'resource_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid', { nullable: true })
  user_id: string;

  @Column({ length: 100 })
  action: string;

  @Column({ length: 50 })
  resource_type: string;

  @Column('uuid', { nullable: true })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
