import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { BillingService } from './billing.service';
import { Tenant } from '../../auth/entities/tenant.entity';
import { Subscription } from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { AuditService } from '../../audit/audit.service';

// Mock Stripe
jest.mock('stripe', () => {
  const mockStripeInstance = {
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      search: jest.fn(),
    },
    accounts: {
      retrieve: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: jest.fn(() => mockStripeInstance),
  };
});

describe('BillingService', () => {
  let service: BillingService;
  let tenantRepository: Repository<Tenant>;
  let subscriptionRepository: Repository<Subscription>;
  let auditService: AuditService;
  let mockStripe: any;

  const mockTenant = {
    id: 'tenant-id',
    name: 'test-garage',
    display_name: 'Test Garage',
  };

  const mockSubscription = {
    id: 'sub-id',
    tenant_id: 'tenant-id',
    stripe_customer_id: null,
  };

  const mockCustomer = {
    id: 'cus_123456789',
    name: 'Test Garage',
    email: 'admin@test-garage.wasplanning.nl',
    metadata: {
      tenant_id: 'tenant-id',
      tenant_name: 'test-garage',
      environment: 'test',
    },
    deleted: false,
  };

  const mockTenantRepository = {
    findOne: jest.fn(),
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, any> = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        NODE_ENV: 'test',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: {},
        },
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    tenantRepository = module.get<Repository<Tenant>>(
      getRepositoryToken(Tenant),
    );
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription),
    );
    auditService = module.get<AuditService>(AuditService);

    // Get the mocked Stripe instance
    mockStripe = (service as any).stripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStripeCustomer', () => {
    it('should create a new Stripe customer', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(mockCustomer);
      mockSubscriptionRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.createStripeCustomer('tenant-id');

      expect(result).toEqual(mockCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        name: 'Test Garage',
        email: 'admin@test-garage.wasplanning.nl',
        metadata: {
          tenant_id: 'tenant-id',
          tenant_name: 'test-garage',
          environment: 'test',
          created_via: 'wasplanning_backend',
        },
      });
      expect(mockSubscriptionRepository.update).toHaveBeenCalledWith(
        { tenant_id: 'tenant-id' },
        { stripe_customer_id: 'cus_123456789' },
      );
      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: 'tenant-id',
          user_id: null,
          action: 'stripe.customer.created',
          resource_type: 'tenant',
          resource_id: 'tenant-id',
          details: {
            customer_name: 'Test Garage',
            customer_email: 'admin@test-garage.wasplanning.nl',
            stripe_customer_id: 'cus_123456789',
          },
          ip_address: '127.0.0.1',
          user_agent: 'System',
        }),
      );
    });

    it('should return existing customer if already exists', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockStripe.customers.search.mockResolvedValue({ data: [mockCustomer] });

      const result = await service.createStripeCustomer('tenant-id');

      expect(result).toEqual(mockCustomer);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should handle errors and log them', async () => {
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe error'));

      await expect(service.createStripeCustomer('tenant-id')).rejects.toThrow(
        'Stripe error',
      );

      expect(mockAuditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'stripe.customer.creation_failed',
          details: expect.objectContaining({
            error: 'Stripe error',
          }),
        }),
      );
    });
  });

  describe('getOrCreateCustomer', () => {
    it('should retrieve existing customer from Stripe', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue({
        ...mockSubscription,
        stripe_customer_id: 'cus_123456789',
      });
      mockStripe.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await service.getOrCreateCustomer('tenant-id');

      expect(result).toEqual(mockCustomer);
      expect(mockStripe.customers.retrieve).toHaveBeenCalledWith(
        'cus_123456789',
      );
    });

    it('should create customer if not found in database', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.getOrCreateCustomer('tenant-id');

      expect(result).toEqual(mockCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalled();
    });

    it('should create new customer if existing one is deleted', async () => {
      mockSubscriptionRepository.findOne.mockResolvedValue({
        ...mockSubscription,
        stripe_customer_id: 'cus_deleted',
      });
      mockStripe.customers.retrieve.mockResolvedValue({
        ...mockCustomer,
        deleted: true,
      });
      mockTenantRepository.findOne.mockResolvedValue(mockTenant);
      mockStripe.customers.search.mockResolvedValue({ data: [] });
      mockStripe.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.getOrCreateCustomer('tenant-id');

      expect(result).toEqual(mockCustomer);
      expect(mockStripe.customers.create).toHaveBeenCalled();
    });
  });

  describe('validateConfiguration', () => {
    it('should return true when configuration is valid', async () => {
      mockStripe.accounts.retrieve.mockResolvedValue({ id: 'acct_123' });

      const result = await service.validateConfiguration();

      expect(result).toBe(true);
      expect(mockStripe.accounts.retrieve).toHaveBeenCalled();
    });

    it('should return false when secret key is missing', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_SECRET_KEY') return null;
        return 'test';
      });

      const service = new BillingService(
        mockConfigService as any,
        tenantRepository,
        subscriptionRepository,
        {} as any, // subscriptionPlanRepository
        {} as any, // paymentMethodRepository
        auditService,
      );

      const result = await service.validateConfiguration();

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      mockStripe.accounts.retrieve.mockRejectedValue(
        new Error('Invalid API key'),
      );

      const result = await service.validateConfiguration();

      expect(result).toBe(false);
    });
  });

  describe('retryStripeCall', () => {
    beforeEach(() => {
      // Override retry delay to 0 for tests
      (service as any).retryDelay = 0;
    });

    it('should retry on rate limit error', async () => {
      const operation = jest.fn();
      const rateLimitError = new Error('Rate limit exceeded') as any;
      rateLimitError.type = 'rate_limit_error';

      operation
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ success: true });

      const result = await (service as any).retryStripeCall(operation);

      expect(result).toEqual({ success: true });
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      const operation = jest.fn();
      const authError = new Error('Invalid API key') as any;
      authError.type = 'authentication_error';

      operation.mockRejectedValue(authError);

      await expect((service as any).retryStripeCall(operation)).rejects.toThrow(
        'Invalid API key',
      );
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const operation = jest.fn();
      const rateLimitError = new Error('Rate limit exceeded') as any;
      rateLimitError.type = 'rate_limit_error';

      operation.mockRejectedValue(rateLimitError);

      await expect((service as any).retryStripeCall(operation)).rejects.toThrow(
        'Rate limit exceeded',
      );
      expect(operation).toHaveBeenCalledTimes(3); // maxRetries = 3
    });
  });
});
