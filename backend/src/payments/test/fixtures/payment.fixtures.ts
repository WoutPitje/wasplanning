import { PaymentMethod } from '../../entities/payment-method.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from '../../entities/payment-transaction.entity';
import { CreatePaymentMethodDto } from '../../dto/create-payment-method.dto';
import { ProcessPaymentDto } from '../../dto/process-payment.dto';

export const createPaymentMethodDto: CreatePaymentMethodDto = {
  type: 'sepa_debit',
  details: {
    consumerName: 'Test User',
    iban: 'NL53INGB0000000000',
  },
  isDefault: true,
  metadata: { source: 'test' },
};

export const processPaymentDto: ProcessPaymentDto = {
  amount: 49.00,
  currency: 'EUR',
  description: 'Subscription payment',
  metadata: { subscriptionId: 'sub-123' },
};

export const mockPaymentMethod: Partial<PaymentMethod> = {
  id: 'pm-123',
  tenantId: 'tenant-123',
  provider: 'mollie',
  providerMethodId: 'mdt_test123',
  type: 'sepa_debit',
  isDefault: true,
  metadata: { consumerName: 'Test User' },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPaymentTransaction: Partial<PaymentTransaction> = {
  id: 'tx-123',
  tenantId: 'tenant-123',
  provider: 'mollie',
  providerTransactionId: 'tr_test123',
  type: TransactionType.PAYMENT,
  status: TransactionStatus.COMPLETED,
  amount: 49.00,
  currency: 'EUR',
  description: 'Subscription payment',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockTenant = {
  id: 'tenant-123',
  name: 'Test Garage',
  email: 'test@garage.com',
};

export const mockUser = {
  id: 'user-123',
  email: 'admin@garage.com',
  tenant: mockTenant,
};