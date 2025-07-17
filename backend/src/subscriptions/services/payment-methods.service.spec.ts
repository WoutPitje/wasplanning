import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaymentMethodsService } from './payment-methods.service';
import {
  PaymentMethod,
  PaymentMethodType,
  CardBrand,
} from '../entities/payment-method.entity';
import { BillingService } from './billing.service';
import { AuditService } from '../../audit/audit.service';

const mockStripe = {
  setupIntents: {
    create: jest.fn(),
  },
  paymentMethods: {
    retrieve: jest.fn(),
    detach: jest.fn(),
  },
  customers: {
    update: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockStripe),
  };
});

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let paymentMethodRepository: Repository<PaymentMethod>;
  let billingService: BillingService;

  const mockTenantId = 'test-tenant-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodsService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: BillingService,
          useValue: {
            getOrCreateCustomer: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-stripe-key'),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentMethodsService>(PaymentMethodsService);
    paymentMethodRepository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
    billingService = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSetupIntent', () => {
    it('should create a setup intent for payment collection', async () => {
      const mockCustomer = { id: 'cus_test123' };
      const mockSetupIntent = {
        id: 'seti_test123',
        client_secret: 'seti_test123_secret',
        payment_method_types: ['card', 'sepa_debit'],
      };

      jest
        .spyOn(billingService, 'getOrCreateCustomer')
        .mockResolvedValue(mockCustomer as any);
      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent);

      const result = await service.createSetupIntent(mockTenantId);

      expect(billingService.getOrCreateCustomer).toHaveBeenCalledWith(
        mockTenantId,
      );
      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: mockCustomer.id,
        payment_method_types: ['card', 'sepa_debit'],
        usage: 'off_session',
        metadata: {
          tenant_id: mockTenantId,
        },
      });
      expect(result).toEqual({
        client_secret: mockSetupIntent.client_secret,
        payment_method_types: mockSetupIntent.payment_method_types,
      });
    });
  });

  describe('listPaymentMethods', () => {
    it('should return active payment methods for a tenant', async () => {
      const mockPaymentMethods = [
        { id: '1', is_default: true, type: PaymentMethodType.CARD },
        { id: '2', is_default: false, type: PaymentMethodType.SEPA_DEBIT },
      ];

      jest
        .spyOn(paymentMethodRepository, 'find')
        .mockResolvedValue(mockPaymentMethods as any);

      const result = await service.listPaymentMethods(mockTenantId);

      expect(paymentMethodRepository.find).toHaveBeenCalledWith({
        where: {
          tenant_id: mockTenantId,
          is_active: true,
        },
        order: {
          is_default: 'DESC',
          created_at: 'DESC',
        },
      });
      expect(result).toEqual(mockPaymentMethods);
    });
  });

  describe('attachPaymentMethod', () => {
    it('should attach a new payment method', async () => {
      const stripePaymentMethodId = 'pm_test123';
      const mockCustomer = { id: 'cus_test123' };
      const mockStripePaymentMethod = {
        id: stripePaymentMethodId,
        type: 'card',
        customer: mockCustomer.id,
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          fingerprint: 'fp_test',
        },
        billing_details: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      jest
        .spyOn(billingService, 'getOrCreateCustomer')
        .mockResolvedValue(mockCustomer as any);
      mockStripe.paymentMethods.retrieve.mockResolvedValue(
        mockStripePaymentMethod,
      );
      jest.spyOn(paymentMethodRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(paymentMethodRepository, 'count').mockResolvedValue(0);
      jest
        .spyOn(paymentMethodRepository, 'create')
        .mockReturnValue({ id: 'pm-1' } as any);
      jest
        .spyOn(paymentMethodRepository, 'save')
        .mockResolvedValue({ id: 'pm-1' } as any);

      const result = await service.attachPaymentMethod(
        mockTenantId,
        stripePaymentMethodId,
      );

      expect(mockStripe.paymentMethods.retrieve).toHaveBeenCalledWith(
        stripePaymentMethodId,
      );
      expect(paymentMethodRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: mockTenantId,
          stripe_payment_method_id: stripePaymentMethodId,
          type: PaymentMethodType.CARD,
          is_default: true,
          billing_name: 'Test User',
          billing_email: 'test@example.com',
        }),
      );
      expect(result).toEqual({ id: 'pm-1' });
    });
  });
});
