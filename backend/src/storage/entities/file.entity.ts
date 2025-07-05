import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';
import { User } from '../../auth/entities/user.entity';

export enum FileCategory {
  PROFILE_PHOTO = 'profile_photo',
  TENANT_LOGO = 'tenant_logo',
  VEHICLE_PHOTO = 'vehicle_photo',
  WASH_BEFORE = 'wash_before',
  WASH_AFTER = 'wash_after',
  DAMAGE_REPORT = 'damage_report',
  INVOICE = 'invoice',
  DOCUMENT = 'document',
  OTHER = 'other'
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenant_id: string;

  @Column('uuid')
  user_id: string;

  @Column({
    type: 'enum',
    enum: FileCategory,
    default: FileCategory.OTHER
  })
  category: FileCategory;

  @Column()
  original_filename: string;

  @Column()
  stored_filename: string;

  @Column()
  mime_type: string;

  @Column({ type: 'bigint' })
  size_bytes: number;

  @Column()
  bucket_name: string;

  @Column()
  object_key: string;

  @Column({ default: false })
  is_public: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}