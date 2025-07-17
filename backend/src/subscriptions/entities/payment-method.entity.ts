import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from '../../auth/entities/tenant.entity';

export enum PaymentMethodType {
  CARD = 'card',
  SEPA_DEBIT = 'sepa_debit',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
  UNKNOWN = 'unknown',
}

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  tenant_id: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ unique: true })
  @Index()
  stripe_payment_method_id: string;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  type: PaymentMethodType;

  @Column({ default: false })
  is_default: boolean;

  // Card specific fields
  @Column({ nullable: true })
  card_brand: CardBrand;

  @Column({ nullable: true })
  card_last4: string;

  @Column({ nullable: true })
  card_exp_month: number;

  @Column({ nullable: true })
  card_exp_year: number;

  @Column({ nullable: true })
  card_fingerprint: string;

  // Bank account fields (for SEPA)
  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_last4: string;

  // Billing details
  @Column({ nullable: true })
  billing_name: string;

  @Column({ nullable: true })
  billing_email: string;

  @Column({ nullable: true })
  billing_phone: string;

  @Column('jsonb', { nullable: true })
  billing_address: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
