import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { MollieProvider } from './providers/mollie/mollie.provider';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentMethodRepository: Repository<PaymentMethod>;
  let transactionRepository: Repository<PaymentTransaction>;
  let mollieProvider: MollieProvider;
  let auditService: AuditService;

  const mockPaymentMethod = {
    id: 'pm-123',
    tenantId: 'tenant-123',
    provider: 'mollie',
    providerMethodId: 'mdt_test123',
    type: 'ideal',
    isDefault: true,
    metadata: { customerId: 'cst_test123' },
  };

  const mockTransaction = {
    id: 'tx-123',
    tenantId: 'tenant-123',
    provider: 'mollie',
    providerTransactionId: 'tr_test123',
    type: TransactionType.SUBSCRIPTION,
    status: TransactionStatus.PENDING,
    amount: 10,
    currency: 'EUR',
    description: 'Test payment',
    metadata: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            manager: {
              getRepository: jest.fn().mockReturnValue({
                findOne: jest.fn(),
              }),
            },
          },
        },
        {
          provide: MollieProvider,
          useValue: {
            createCustomer: jest.fn(),
            getCustomer: jest.fn(),
            createPaymentMethod: jest.fn(),
            deletePaymentMethod: jest.fn(),
            listPaymentMethods: jest.fn(),
            createPayment: jest.fn(),
            getPayment: jest.fn(),
            createCheckoutPayment: jest.fn(),
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            getSubscription: jest.fn(),
            listMandates: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentMethodRepository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod)
    );
    transactionRepository = module.get<Repository<PaymentTransaction>>(
      getRepositoryToken(PaymentTransaction)
    );
    mollieProvider = module.get<MollieProvider>(MollieProvider);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateCustomer', () => {
    it('should create a new customer if none exists', async () => {
      const mockSubscriptionRepo = { findOne: jest.fn().mockResolvedValue(null) };
      (transactionRepository.manager.getRepository as jest.Mock).mockReturnValue(mockSubscriptionRepo);
      (mollieProvider.createCustomer as jest.Mock).mockResolvedValue('cst_new123');

      const result = await service.getOrCreateCustomer('tenant-123', {
        email: 'test@example.com',
        name: 'Test Tenant',
        metadata: { test: true },
      });

      expect(result).toEqual({ id: 'cst_new123', isNew: true });
      expect(mollieProvider.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        'Test Tenant',
        { test: true, tenantId: 'tenant-123' }
      );
    });

    it('should return existing customer if found', async () => {
      const mockSubscriptionRepo = {
        findOne: jest.fn().mockResolvedValue({ mollieCustomerId: 'cst_existing123' }),
      };
      (transactionRepository.manager.getRepository as jest.Mock).mockReturnValue(mockSubscriptionRepo);
      (mollieProvider.getCustomer as jest.Mock).mockResolvedValue({ id: 'cst_existing123' });

      const result = await service.getOrCreateCustomer('tenant-123', {
        email: 'test@example.com',
      });

      expect(result).toEqual({ id: 'cst_existing123', isNew: false });
      expect(mollieProvider.createCustomer).not.toHaveBeenCalled();
    });

    it('should create new customer if existing one is not found in Mollie', async () => {
      const mockSubscriptionRepo = {
        findOne: jest.fn().mockResolvedValue({ mollieCustomerId: 'cst_deleted123' }),
      };
      (transactionRepository.manager.getRepository as jest.Mock).mockReturnValue(mockSubscriptionRepo);
      (mollieProvider.getCustomer as jest.Mock).mockRejectedValue(new Error('Not found'));
      (mollieProvider.createCustomer as jest.Mock).mockResolvedValue('cst_new123');

      const result = await service.getOrCreateCustomer('tenant-123', {
        email: 'test@example.com',
      });

      expect(result).toEqual({ id: 'cst_new123', isNew: true });
    });
  });

  describe('createCheckoutPayment', () => {
    it('should create a checkout payment successfully', async () => {
      const mockPayment = {
        id: 'tr_test123',
        checkoutUrl: 'https://mollie.com/checkout/test',
        status: 'open',
      };

      (mollieProvider.createCheckoutPayment as jest.Mock).mockResolvedValue(mockPayment);
      (transactionRepository.create as jest.Mock).mockReturnValue(mockTransaction);
      (transactionRepository.save as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await service.createCheckoutPayment({
        amount: 10,
        currency: 'EUR',
        description: 'Test payment',
        customerId: 'cst_test123',
        redirectUrl: 'https://example.com/return',
        metadata: { tenantId: 'tenant-123' },
      });

      expect(result).toEqual(mockPayment);
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PAYMENT_CREATED',
          resource_type: 'PaymentTransaction',
        })
      );
    });

    it('should throw error if tenantId is missing from metadata', async () => {
      await expect(
        service.createCheckoutPayment({
          amount: 10,
          currency: 'EUR',
          description: 'Test payment',
          redirectUrl: 'https://example.com/return',
          metadata: {},
        })
      ).rejects.toThrow('Invalid payment metadata: missing tenantId');
    });
  });

  describe('createSubscription', () => {
    it('should create a Mollie subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        nextPaymentDate: new Date('2024-02-01'),
      };

      (mollieProvider.createSubscription as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.createSubscription({
        customerId: 'cst_test123',
        amount: 10,
        currency: 'EUR',
        interval: 'monthly',
        description: 'Test subscription',
      });

      expect(result).toEqual(mockSubscription);
    });

    it('should handle errors when creating subscription', async () => {
      (mollieProvider.createSubscription as jest.Mock).mockRejectedValue(
        new Error('No valid mandate')
      );

      await expect(
        service.createSubscription({
          customerId: 'cst_test123',
          amount: 10,
          currency: 'EUR',
          interval: 'monthly',
          description: 'Test subscription',
        })
      ).rejects.toThrow('No valid mandate');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      (mollieProvider.cancelSubscription as jest.Mock).mockResolvedValue(undefined);

      await service.cancelSubscription('sub_test123');

      expect(mollieProvider.cancelSubscription).toHaveBeenCalledWith('sub_test123');
    });
  });

  describe('hasValidMandate', () => {
    it('should return true if customer has valid mandates', async () => {
      (mollieProvider.listMandates as jest.Mock).mockResolvedValue([
        { id: 'mdt_test123', status: 'valid' },
      ]);

      const result = await service.hasValidMandate('cst_test123');

      expect(result).toBe(true);
    });

    it('should return false if customer has no valid mandates', async () => {
      (mollieProvider.listMandates as jest.Mock).mockResolvedValue([]);

      const result = await service.hasValidMandate('cst_test123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (mollieProvider.listMandates as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await service.hasValidMandate('cst_test123');

      expect(result).toBe(false);
    });
  });

  describe('getPayment', () => {
    it('should get payment details successfully', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'paid',
        amount: 10,
        metadata: { test: true },
      };

      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(mockPayment);

      const result = await service.getPayment('tr_test123');

      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment not found', async () => {
      (mollieProvider.getPayment as jest.Mock).mockRejectedValue(new Error('Not found'));

      await expect(service.getPayment('tr_invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const mockUpdateResult = { affected: 1 };
      (transactionRepository.update as jest.Mock).mockResolvedValue(mockUpdateResult);

      await service.updateTransactionStatus('tr_test123', TransactionStatus.COMPLETED);

      expect(transactionRepository.update).toHaveBeenCalledWith(
        { providerTransactionId: 'tr_test123' },
        { status: TransactionStatus.COMPLETED }
      );
    });

    it('should log warning if no transaction found', async () => {
      const mockUpdateResult = { affected: 0 };
      (transactionRepository.update as jest.Mock).mockResolvedValue(mockUpdateResult);

      const loggerSpy = jest.spyOn(service['logger'], 'warn');

      await service.updateTransactionStatus('tr_test123', TransactionStatus.FAILED);

      expect(loggerSpy).toHaveBeenCalledWith(
        'No transaction found with providerTransactionId: tr_test123'
      );
    });
  });

  describe('getPaymentMethods', () => {
    it('should return payment methods for a tenant', async () => {
      const mockMethods = [mockPaymentMethod];
      (paymentMethodRepository.find as jest.Mock).mockResolvedValue(mockMethods);

      const result = await service.getPaymentMethods('tenant-123');

      expect(result).toEqual(mockMethods);
      expect(paymentMethodRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('should set payment method as default', async () => {
      (paymentMethodRepository.findOne as jest.Mock).mockResolvedValue(mockPaymentMethod);
      (paymentMethodRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });
      (paymentMethodRepository.save as jest.Mock).mockResolvedValue({
        ...mockPaymentMethod,
        isDefault: true,
      });

      const result = await service.setDefaultPaymentMethod('tenant-123', 'pm-123');

      expect(paymentMethodRepository.update).toHaveBeenCalledWith(
        { tenantId: 'tenant-123' },
        { isDefault: false }
      );
      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundException if payment method not found', async () => {
      (paymentMethodRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.setDefaultPaymentMethod('tenant-123', 'pm-invalid')
      ).rejects.toThrow(NotFoundException);
    });
  });
});