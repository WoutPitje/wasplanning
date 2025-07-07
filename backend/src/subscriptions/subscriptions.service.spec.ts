import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription, SubscriptionStatus, BillingInterval } from './entities/subscription.entity';
import { SubscriptionPlan, PlanName } from './entities/subscription-plan.entity';
import { PaymentsService } from '../payments/payments.service';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { ProrationService } from './services/proration.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: Repository<Subscription>;
  let planRepository: Repository<SubscriptionPlan>;
  let paymentsService: PaymentsService;
  let usageService: UsageService;
  let limitsService: LimitsService;
  let prorationService: ProrationService;
  let auditService: AuditService;

  const mockPlan = {
    id: 'plan-123',
    name: PlanName.STARTER,
    displayName: 'Starter',
    priceMonthly: 49,
    priceYearly: 490,
    isActive: true,
    features: {},
  };

  const mockSubscription = {
    id: 'sub-123',
    tenantId: 'tenant-123',
    planId: 'plan-123',
    plan: mockPlan,
    status: SubscriptionStatus.ACTIVE,
    billingInterval: BillingInterval.MONTH,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    creditBalance: 0,
    mollieCustomerId: 'cst_test123',
    mollieSubscriptionId: 'sub_test123',
    metadata: {},
  };

  const mockTenant = {
    id: 'tenant-123',
    display_name: 'Test Tenant',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
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
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            getOrCreateCustomer: jest.fn(),
            hasValidMandate: jest.fn(),
            createCheckoutPayment: jest.fn(),
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            getPayment: jest.fn(),
          },
        },
        {
          provide: UsageService,
          useValue: {
            getCurrentPeriodUsage: jest.fn(),
            recordUsage: jest.fn(),
            recordActiveUser: jest.fn(),
            recordActiveLocation: jest.fn(),
          },
        },
        {
          provide: LimitsService,
          useValue: {
            getAllLimits: jest.fn(),
            getLimitWarnings: jest.fn(),
            checkLimit: jest.fn(),
            hasFeature: jest.fn(),
          },
        },
        {
          provide: ProrationService,
          useValue: {
            calculateProration: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
            findByResourceId: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(30), // Default trial days
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get<Repository<Subscription>>(
      getRepositoryToken(Subscription)
    );
    planRepository = module.get<Repository<SubscriptionPlan>>(
      getRepositoryToken(SubscriptionPlan)
    );
    paymentsService = module.get<PaymentsService>(PaymentsService);
    usageService = module.get<UsageService>(UsageService);
    limitsService = module.get<LimitsService>(LimitsService);
    prorationService = module.get<ProrationService>(ProrationService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaidSubscription', () => {
    it('should create subscription with mandate setup for new customer', async () => {
      const mockTenantRepo = { findOne: jest.fn().mockResolvedValue(mockTenant) };
      (subscriptionRepository.manager.getRepository as jest.Mock).mockReturnValue(mockTenantRepo);
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(null);
      (planRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
      (paymentsService.getOrCreateCustomer as jest.Mock).mockResolvedValue({
        id: 'cst_new123',
        isNew: true,
      });
      (paymentsService.hasValidMandate as jest.Mock).mockResolvedValue(false);
      (paymentsService.createCheckoutPayment as jest.Mock).mockResolvedValue({
        id: 'tr_test123',
        checkoutUrl: 'https://mollie.com/checkout/test',
        status: 'open',
      });
      (subscriptionRepository.create as jest.Mock).mockReturnValue(mockSubscription);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.createPaidSubscription('tenant-123', {
        planName: PlanName.STARTER,
        billingInterval: BillingInterval.MONTH,
        returnUrl: 'https://example.com/return',
      });

      expect(result.checkoutUrl).toBe('https://mollie.com/checkout/test');
      expect(paymentsService.createCheckoutPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sequenceType: 'first',
          amount: 49,
        })
      );
    });

    it('should create subscription directly if customer has valid mandate', async () => {
      const mockTenantRepo = { findOne: jest.fn().mockResolvedValue(mockTenant) };
      (subscriptionRepository.manager.getRepository as jest.Mock).mockReturnValue(mockTenantRepo);
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(null);
      (planRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
      (paymentsService.getOrCreateCustomer as jest.Mock).mockResolvedValue({
        id: 'cst_existing123',
        isNew: false,
      });
      (paymentsService.hasValidMandate as jest.Mock).mockResolvedValue(true);
      (paymentsService.createSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        nextPaymentDate: new Date('2024-02-01'),
      });
      (subscriptionRepository.create as jest.Mock).mockReturnValue(mockSubscription);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await service.createPaidSubscription('tenant-123', {
        planName: PlanName.STARTER,
        billingInterval: BillingInterval.MONTH,
        returnUrl: 'https://example.com/return',
      });

      expect(result.checkoutUrl).toBe('https://example.com/return?status=success');
      expect(paymentsService.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cst_existing123',
          amount: 49,
          interval: 'monthly',
        })
      );
    });

    it('should throw error if tenant already has subscription', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);

      await expect(
        service.createPaidSubscription('tenant-123', {
          planName: PlanName.STARTER,
          billingInterval: BillingInterval.MONTH,
          returnUrl: 'https://example.com/return',
        })
      ).rejects.toThrow('Tenant already has a subscription');
    });
  });

  describe('completeNewSubscription', () => {
    it('should complete subscription after mandate setup payment', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'paid',
        amount: 49,
        metadata: {
          tenantId: 'tenant-123',
          action: 'subscription_mandate_setup',
        },
      };

      const incompleteSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.INCOMPLETE,
        metadata: { pendingPaymentId: 'tr_test123' },
      };

      (paymentsService.getPayment as jest.Mock).mockResolvedValue(mockPayment);
      (subscriptionRepository.find as jest.Mock).mockResolvedValue([incompleteSubscription]);
      (planRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
      (paymentsService.createSubscription as jest.Mock).mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        nextPaymentDate: new Date('2024-02-01'),
      });
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...incompleteSubscription,
        status: SubscriptionStatus.ACTIVE,
        mollieSubscriptionId: 'sub_test123',
      });

      const result = await service.completeNewSubscription('tr_test123');

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.mollieSubscriptionId).toBe('sub_test123');
      expect(paymentsService.createSubscription).toHaveBeenCalled();
    });

    it('should handle failed Mollie subscription creation', async () => {
      const mockPayment = {
        id: 'tr_test123',
        status: 'paid',
        amount: 49,
        metadata: {
          tenantId: 'tenant-123',
          action: 'subscription_mandate_setup',
        },
      };

      const incompleteSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.INCOMPLETE,
        metadata: { pendingPaymentId: 'tr_test123' },
      };

      (paymentsService.getPayment as jest.Mock).mockResolvedValue(mockPayment);
      (subscriptionRepository.find as jest.Mock).mockResolvedValue([incompleteSubscription]);
      (planRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
      (paymentsService.createSubscription as jest.Mock).mockRejectedValue(
        new Error('Subscription creation failed')
      );
      (subscriptionRepository.save as jest.Mock).mockResolvedValue(incompleteSubscription);

      await expect(service.completeNewSubscription('tr_test123')).rejects.toThrow(
        'Subscription creation failed'
      );

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.INCOMPLETE,
          metadata: expect.objectContaining({
            error: 'Subscription creation failed',
          }),
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription with Mollie', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (paymentsService.cancelSubscription as jest.Mock).mockResolvedValue(undefined);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      });

      const result = await service.cancelSubscription('tenant-123', 'sub-123', true);

      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      expect(paymentsService.cancelSubscription).toHaveBeenCalledWith('sub_test123');
    });

    it('should handle Mollie cancellation errors gracefully', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (paymentsService.cancelSubscription as jest.Mock).mockRejectedValue(
        new Error('Mollie API error')
      );
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      });

      const result = await service.cancelSubscription('tenant-123', 'sub-123', true);

      expect(result.status).toBe(SubscriptionStatus.CANCELED);
      // Should continue with local cancellation even if Mollie fails
    });

    it('should set cancelAtPeriodEnd for non-immediate cancellation', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        status: SubscriptionStatus.ACTIVE, // Status should remain ACTIVE for non-immediate cancellation
      });

      const result = await service.cancelSubscription('tenant-123', 'sub-123', false);

      expect(result.cancelAtPeriodEnd).toBe(true);
      expect(result.status).not.toBe(SubscriptionStatus.CANCELED);
    });
  });

  describe('changeSubscriptionPlan', () => {
    it('should handle plan upgrade with credits', async () => {
      const subscriptionWithCredits = {
        ...mockSubscription,
        creditBalance: 20,
      };

      const groeiPlan = {
        ...mockPlan,
        id: 'plan-456',
        name: PlanName.GROEI,
        priceMonthly: 149,
      };

      const proration = {
        amount: 50,
        credit: 0,
        isUpgrade: true,
        description: 'Upgrade proration',
        daysRemaining: 15,
        totalDays: 30,
      };

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscriptionWithCredits);
      (planRepository.findOne as jest.Mock).mockResolvedValue(groeiPlan);
      (prorationService.calculateProration as jest.Mock).mockReturnValue(proration);
      (paymentsService.getOrCreateCustomer as jest.Mock).mockResolvedValue({
        id: 'cst_test123',
        isNew: false,
      });
      (paymentsService.createCheckoutPayment as jest.Mock).mockResolvedValue({
        id: 'tr_change123',
        checkoutUrl: 'https://mollie.com/checkout/change',
        status: 'open',
      });
      (subscriptionRepository.save as jest.Mock).mockResolvedValue(subscriptionWithCredits);

      const result = await service.changeSubscriptionPlan(
        'tenant-123',
        'sub-123',
        PlanName.GROEI,
        'https://example.com/return',
        BillingInterval.MONTH
      );

      expect(result.checkoutUrl).toBe('https://mollie.com/checkout/change');
      expect(paymentsService.createCheckoutPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 30, // 50 - 20 credits
        })
      );
    });

    it('should handle plan downgrade with credit generation', async () => {
      const groeiSubscription = {
        ...mockSubscription,
        plan: {
          ...mockPlan,
          name: PlanName.GROEI,
          priceMonthly: 149,
        },
      };

      const proration = {
        amount: 0,
        credit: 50,
        isUpgrade: false,
        description: 'Downgrade credit',
        daysRemaining: 15,
        totalDays: 30,
      };

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(groeiSubscription);
      (planRepository.findOne as jest.Mock).mockResolvedValue(mockPlan);
      (prorationService.calculateProration as jest.Mock).mockReturnValue(proration);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...groeiSubscription,
        creditBalance: 50,
      });

      const result = await service.changeSubscriptionPlan(
        'tenant-123',
        'sub-123',
        PlanName.STARTER,
        'https://example.com/return'
      );

      expect(result.checkoutUrl).toBe(''); // No payment needed for downgrade
      expect(result.subscription.creditBalance).toBe(50);
    });
  });

  describe('processRecurringPayment', () => {
    it('should update subscription period after recurring payment', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await service.processRecurringPayment('sub-123', 'tr_recurring123', 49);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: expect.any(Date),
          currentPeriodEnd: expect.any(Date),
        })
      );
    });

    it('should apply credits to recurring payment', async () => {
      const subscriptionWithCredits = {
        ...mockSubscription,
        creditBalance: 20,
      };

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(subscriptionWithCredits);
      (subscriptionRepository.save as jest.Mock).mockResolvedValue({
        ...subscriptionWithCredits,
        creditBalance: 0,
      });

      await service.processRecurringPayment('sub-123', 'tr_recurring123', 49);

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          creditBalance: 0, // 20 credits used, 29 paid
        })
      );
    });
  });

  describe('getCurrentUsage', () => {
    it('should return usage data for active subscription', async () => {
      const mockUsage = { cars_washed: 100, active_users: 5, active_locations: 1 };
      const mockLimits = {
        cars: { current: 100, limit: 500, percentage: 20 },
        users: { current: 5, limit: 5, percentage: 100 },
        locations: { current: 1, limit: 1, percentage: 100 },
      };
      const mockWarnings = { warning: true, critical: false, messages: ['User limit reached'] };

      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(mockSubscription);
      (usageService.getCurrentPeriodUsage as jest.Mock).mockResolvedValue(mockUsage);
      (limitsService.getAllLimits as jest.Mock).mockResolvedValue(mockLimits);
      (limitsService.getLimitWarnings as jest.Mock).mockResolvedValue(mockWarnings);

      const result = await service.getCurrentUsage('tenant-123');

      expect(result).toEqual({
        subscription: expect.objectContaining({
          id: 'sub-123',
          plan: mockPlan,
        }),
        usage: mockUsage,
        limits: mockLimits,
        warnings: mockWarnings,
      });
    });

    it('should return empty usage data when no subscription exists', async () => {
      (subscriptionRepository.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getCurrentUsage('tenant-123');

      expect(result).toEqual({
        usage: {
          cars_washed: 0,
          active_users: 0,
          active_locations: 0,
        },
        limits: {
          cars: { current: 0, limit: null, percentage: 0 },
          users: { current: 0, limit: null, percentage: 0 },
          locations: { current: 0, limit: null, percentage: 0 },
        },
        warnings: {
          warning: false,
          critical: false,
          messages: [],
        },
      });
    });
  });
});