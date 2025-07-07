import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MollieProvider } from './mollie.provider';
import { createMollieClient } from '@mollie/api-client';

jest.mock('@mollie/api-client');

describe('MollieProvider', () => {
  let provider: MollieProvider;
  let mockMollieClient: any;
  let configService: ConfigService;

  beforeEach(async () => {
    mockMollieClient = {
      customers: {
        create: jest.fn(),
        get: jest.fn(),
      },
      customers_mandates: {
        page: jest.fn(),
        create: jest.fn(),
        revoke: jest.fn(),
      },
      customers_subscriptions: {
        create: jest.fn(),
        update: jest.fn(),
        cancel: jest.fn(),
        get: jest.fn(),
      },
      payments: {
        create: jest.fn(),
        get: jest.fn(),
      },
      subscriptions: {
        get: jest.fn(),
      },
      refunds: {
        get: jest.fn(),
      },
      chargebacks: {
        get: jest.fn(),
      },
    };

    (createMollieClient as jest.Mock).mockReturnValue(mockMollieClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MollieProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'MOLLIE_API_KEY':
                  return 'test_api_key';
                case 'MOLLIE_WEBHOOK_URL':
                  return 'https://example.com/webhook';
                case 'NODE_ENV':
                  return 'test';
                default:
                  return null;
              }
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<MollieProvider>(MollieProvider);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = { id: 'cst_test123' };
      mockMollieClient.customers.create.mockResolvedValue(mockCustomer);

      const result = await provider.createCustomer(
        'test@example.com',
        'Test Customer',
        { tenantId: '123' }
      );

      expect(mockMollieClient.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test Customer',
        metadata: { tenantId: '123' },
      });
      expect(result).toBe('cst_test123');
    });

    it('should handle errors when creating customer', async () => {
      mockMollieClient.customers.create.mockRejectedValue(new Error('API Error'));

      await expect(
        provider.createCustomer('test@example.com', 'Test Customer')
      ).rejects.toThrow('API Error');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const mockCustomer = { id: 'cst_test123' };
      const mockMandates = [{ id: 'mdt_test123', status: 'valid' }];
      const mockSubscription = {
        id: 'sub_test123',
        status: 'active',
        amount: { value: '10.00', currency: 'EUR' },
        interval: '1 month',
        nextPaymentDate: '2024-02-01',
        metadata: { test: true },
      };

      mockMollieClient.customers.get.mockResolvedValue(mockCustomer);
      mockMollieClient.customers_mandates.page.mockResolvedValue(mockMandates);
      mockMollieClient.customers_subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await provider.createSubscription({
        customerId: 'cst_test123',
        amount: 10,
        currency: 'EUR',
        interval: 'monthly',
        description: 'Test subscription',
        metadata: { test: true },
      });

      expect(result).toEqual({
        id: 'sub_test123',
        providerId: 'sub_test123',
        status: 'active',
        amount: 10,
        currency: 'EUR',
        interval: 'monthly',
        nextPaymentDate: new Date('2024-02-01'),
        metadata: { test: true },
      });
    });

    it('should throw error if customer has no valid mandate', async () => {
      mockMollieClient.customers.get.mockResolvedValue({ id: 'cst_test123' });
      mockMollieClient.customers_mandates.page.mockResolvedValue([]);

      await expect(
        provider.createSubscription({
          customerId: 'cst_test123',
          amount: 10,
          currency: 'EUR',
          interval: 'monthly',
          description: 'Test subscription',
        })
      ).rejects.toThrow('Customer has no valid payment mandate');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customerId: 'cst_test123',
      };

      mockMollieClient.customers_subscriptions.get.mockResolvedValue(mockSubscription);
      mockMollieClient.customers_subscriptions.cancel.mockResolvedValue({});

      await provider.cancelSubscription('sub_test123');

      expect(mockMollieClient.customers_subscriptions.cancel).toHaveBeenCalledWith(
        'cst_test123',
        'sub_test123'
      );
    });
  });

  describe('createCheckoutPayment', () => {
    it('should create a checkout payment successfully', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'open',
        _links: {
          checkout: {
            href: 'https://www.mollie.com/checkout/test123',
          },
        },
      };

      mockMollieClient.payments.create.mockResolvedValue(mockPayment);

      const result = await provider.createCheckoutPayment({
        amount: 10,
        currency: 'EUR',
        description: 'Test payment',
        customerId: 'cst_test123',
        redirectUrl: 'https://example.com/return',
        sequenceType: 'first',
      });

      expect(result).toEqual({
        id: 'tr_test123',
        checkoutUrl: 'https://www.mollie.com/checkout/test123',
        status: 'open',
      });

      expect(mockMollieClient.payments.create).toHaveBeenCalledWith({
        amount: { value: '10.00', currency: 'EUR' },
        description: 'Test payment',
        customerId: 'cst_test123',
        redirectUrl: 'https://example.com/return',
        webhookUrl: 'https://example.com/webhook',
        metadata: undefined,
        sequenceType: 'first',
      });
    });

    it('should throw error if no checkout URL is returned', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'open',
        _links: {},
      };

      mockMollieClient.payments.create.mockResolvedValue(mockPayment);

      await expect(
        provider.createCheckoutPayment({
          amount: 10,
          currency: 'EUR',
          description: 'Test payment',
          redirectUrl: 'https://example.com/return',
        })
      ).rejects.toThrow('No checkout URL returned from Mollie');
    });
  });

  describe('getPayment', () => {
    it('should get payment details successfully', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'paid',
        amount: { value: '10.00', currency: 'EUR' },
        paidAt: '2024-01-01T12:00:00.000Z',
        metadata: { test: true },
      };

      mockMollieClient.payments.get.mockResolvedValue(mockPayment);

      const result = await provider.getPayment('tr_test123');

      expect(result).toEqual({
        id: 'tr_test123',
        providerId: 'tr_test123',
        status: 'paid',
        amount: 10,
        currency: 'EUR',
        paidAt: new Date('2024-01-01T12:00:00.000Z'),
        metadata: { test: true },
      });
    });
  });

  describe('listMandates', () => {
    it('should list valid mandates for a customer', async () => {
      const mockMandates = [
        { id: 'mdt_test1', status: 'valid', method: 'ideal' },
        { id: 'mdt_test2', status: 'invalid', method: 'creditcard' },
        { id: 'mdt_test3', status: 'valid', method: 'sepa' },
      ];

      mockMollieClient.customers_mandates.page.mockResolvedValue(mockMandates);

      const result = await provider.listMandates('cst_test123');

      expect(result).toEqual([
        { id: 'mdt_test1', status: 'valid', method: 'ideal' },
        { id: 'mdt_test3', status: 'valid', method: 'sepa' },
      ]);
    });
  });

  describe('parseWebhook', () => {
    it('should parse payment webhook correctly', async () => {
      const webhook = { id: 'tr_test123' };
      const result = provider.parseWebhook(webhook);

      expect(result.type).toBe('payment.updated');
      expect(result.data.resourceType).toBe('payment');
      expect(result.id).toBe('tr_test123');
    });

    it('should parse subscription webhook correctly', async () => {
      const webhook = { id: 'sub_test123' };
      const result = provider.parseWebhook(webhook);

      expect(result.type).toBe('subscription.updated');
      expect(result.data.resourceType).toBe('subscription');
      expect(result.id).toBe('sub_test123');
    });

    it('should handle unknown webhook types', async () => {
      const webhook = { id: 'unknown_123' };
      const result = provider.parseWebhook(webhook);

      expect(result.type).toBe('unknown');
      expect(result.data.resourceType).toBe('unknown');
    });
  });

  describe('validateWebhook', () => {
    it('should return true for valid payment webhook', async () => {
      const mockPayment = { id: 'tr_test123', status: 'paid' };
      (mockMollieClient.payments.get as jest.Mock).mockResolvedValue(mockPayment);
      
      const result = await provider.validateWebhook({ id: 'tr_test123' }, 'signature');
      expect(result).toBe(true);
    });

    it('should return false for invalid webhook body', async () => {
      const result = await provider.validateWebhook({}, 'signature');
      expect(result).toBe(false);
    });

    it('should return false when resource not found', async () => {
      (mockMollieClient.payments.get as jest.Mock).mockRejectedValue(new Error('Not found'));
      
      const result = await provider.validateWebhook({ id: 'tr_test123' }, 'signature');
      expect(result).toBe(false);
    });
  });
});