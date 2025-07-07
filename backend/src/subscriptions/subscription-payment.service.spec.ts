import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionsService } from './subscriptions.service';
import { PaymentsService } from '../payments/payments.service';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { AuditService } from '../audit/audit.service';
import { Subscription, SubscriptionStatus, BillingInterval } from './entities/subscription.entity';
import { SubscriptionPlan, PlanName, BillingType } from './entities/subscription-plan.entity';

describe('SubscriptionsService - Payment Flow', () => {
  let service: SubscriptionsService;
  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;
  let planRepository: jest.Mocked<Repository<SubscriptionPlan>>;
  let paymentsService: jest.Mocked<PaymentsService>;
  let auditService: jest.Mocked<AuditService>;

  const mockTenantId = 'test-tenant-id';
  const mockSubscriptionId = 'test-subscription-id';
  const mockCustomerId = 'test-customer-id';
  const mockPaymentId = 'test-payment-id';

  const mockCurrentPlan: SubscriptionPlan = {
    id: 'plan-starter-id',
    name: PlanName.STARTER,
    displayName: 'Starter',
    priceMonthly: 49.00,
    priceYearly: 490.00,
    billingType: BillingType.SUBSCRIPTION,
    maxCarsPerMonth: 500,
    maxUsers: 5,
    maxLocations: 1,
    features: {
      basic_features: true,
      advanced_reporting: false,
      api_access: false,
      priority_support: false,
    },
    overagePricePerCar: null,
    overagePricePerLocation: null,
    isActive: true,
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockNewPlan: SubscriptionPlan = {
    id: 'plan-groei-id',
    name: PlanName.GROEI,
    displayName: 'Groei',
    priceMonthly: 149.00,
    priceYearly: 1490.00,
    billingType: BillingType.SUBSCRIPTION,
    maxCarsPerMonth: 2000,
    maxUsers: 20,
    maxLocations: 3,
    features: {
      basic_features: true,
      advanced_reporting: true,
      api_access: true,
      priority_support: true,
    },
    overagePricePerCar: null,
    overagePricePerLocation: null,
    isActive: true,
    subscriptions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription: Subscription = {
    id: mockSubscriptionId,
    tenant: null, // Will be mocked when needed
    tenantId: mockTenantId,
    planId: mockCurrentPlan.id,
    plan: mockCurrentPlan,
    paymentMethod: null, // Will be mocked when needed  
    paymentMethodId: 'payment-method-id',
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    billingInterval: BillingInterval.MONTH,
    provider: 'mollie',
    providerSubscriptionId: 'sub_test123',
    trialEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
    metadata: {},
    usageRecords: [],
    billingCycles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SubscriptionPlan),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: PaymentsService,
          useValue: {
            getOrCreateCustomer: jest.fn(),
            createCheckoutPayment: jest.fn(),
            getPayment: jest.fn(),
          },
        },
        {
          provide: UsageService,
          useValue: {},
        },
        {
          provide: LimitsService,
          useValue: {},
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
    planRepository = module.get(getRepositoryToken(SubscriptionPlan));
    paymentsService = module.get(PaymentsService);
    auditService = module.get(AuditService);
  });

  describe('changeSubscriptionPlan', () => {
    const returnUrl = 'https://example.com/return';

    it('should initiate subscription plan change successfully', async () => {
      // Arrange
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      planRepository.findOne.mockResolvedValue(mockNewPlan);
      paymentsService.getOrCreateCustomer.mockResolvedValue({ id: mockCustomerId });
      paymentsService.createCheckoutPayment.mockResolvedValue({
        id: mockPaymentId,
        checkoutUrl: 'https://checkout.mollie.com/test',
        status: 'open',
      });

      // Act
      const result = await service.changeSubscriptionPlan(
        mockTenantId,
        mockSubscriptionId,
        PlanName.GROEI,
        returnUrl,
      );

      // Assert
      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSubscriptionId, tenantId: mockTenantId },
        relations: ['plan'],
      });

      expect(planRepository.findOne).toHaveBeenCalledWith({
        where: { name: PlanName.GROEI, isActive: true },
      });

      expect(paymentsService.getOrCreateCustomer).toHaveBeenCalledWith(
        mockTenantId,
        {
          email: `tenant-${mockTenantId}@garage.example.com`,
          metadata: { tenantId: mockTenantId, action: 'subscription_change' },
        },
      );

      expect(paymentsService.createCheckoutPayment).toHaveBeenCalledWith({
        amount: mockNewPlan.priceMonthly,
        currency: 'EUR',
        description: `Subscription upgrade to ${mockNewPlan.displayName}`,
        customerId: mockCustomerId,
        redirectUrl: returnUrl,
        webhookUrl: process.env.MOLLIE_WEBHOOK_URL,
        metadata: {
          tenantId: mockTenantId,
          subscriptionId: mockSubscriptionId,
          newPlanName: PlanName.GROEI,
          action: 'subscription_change',
        },
      });

      expect(auditService.logAction).toHaveBeenCalledWith({
        action: 'SUBSCRIPTION_CHANGE_INITIATED',
        resource_type: 'Subscription',
        resource_id: mockSubscriptionId,
        details: {
          currentPlan: mockCurrentPlan.name,
          newPlan: PlanName.GROEI,
          amount: mockNewPlan.priceMonthly,
          paymentId: mockPaymentId,
        },
        tenant_id: mockTenantId,
      });

      expect(result).toEqual({
        checkoutUrl: 'https://checkout.mollie.com/test',
        subscription: mockSubscription,
      });
    });

    it('should throw NotFoundException if subscription not found', async () => {
      // Arrange
      subscriptionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changeSubscriptionPlan(
          mockTenantId,
          mockSubscriptionId,
          PlanName.GROEI,
          returnUrl,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new plan not found', async () => {
      // Arrange
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      planRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changeSubscriptionPlan(
          mockTenantId,
          mockSubscriptionId,
          PlanName.GROEI,
          returnUrl,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate yearly amount for yearly billing interval', async () => {
      // Arrange
      const yearlySubscription = {
        ...mockSubscription,
        billingInterval: BillingInterval.YEAR,
      };
      subscriptionRepository.findOne.mockResolvedValue(yearlySubscription);
      planRepository.findOne.mockResolvedValue(mockNewPlan);
      paymentsService.getOrCreateCustomer.mockResolvedValue({ id: mockCustomerId });
      paymentsService.createCheckoutPayment.mockResolvedValue({
        id: mockPaymentId,
        checkoutUrl: 'https://checkout.mollie.com/test',
        status: 'open',
      });

      // Act
      await service.changeSubscriptionPlan(
        mockTenantId,
        mockSubscriptionId,
        PlanName.GROEI,
        returnUrl,
      );

      // Assert
      expect(paymentsService.createCheckoutPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: mockNewPlan.priceYearly,
        }),
      );
    });

    it('should throw BadRequestException if payment creation fails', async () => {
      // Arrange
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      planRepository.findOne.mockResolvedValue(mockNewPlan);
      paymentsService.getOrCreateCustomer.mockResolvedValue({ id: mockCustomerId });
      paymentsService.createCheckoutPayment.mockRejectedValue(new Error('Payment failed'));

      // Act & Assert
      await expect(
        service.changeSubscriptionPlan(
          mockTenantId,
          mockSubscriptionId,
          PlanName.GROEI,
          returnUrl,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeSubscriptionChange', () => {
    const mockPayment = {
      id: mockPaymentId,
      status: 'paid',
      amount: mockNewPlan.priceMonthly,
      metadata: {
        tenantId: mockTenantId,
        subscriptionId: mockSubscriptionId,
        newPlanName: PlanName.GROEI,
        action: 'subscription_change',
      },
    };

    it('should complete subscription change successfully', async () => {
      // Arrange
      paymentsService.getPayment.mockResolvedValue(mockPayment);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      planRepository.findOne.mockResolvedValue(mockNewPlan);
      
      const updatedSubscription = {
        ...mockSubscription,
        planId: mockNewPlan.id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
      subscriptionRepository.save.mockResolvedValue(updatedSubscription);

      // Act
      const result = await service.completeSubscriptionChange(mockPaymentId);

      // Assert
      expect(paymentsService.getPayment).toHaveBeenCalledWith(mockPaymentId);

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSubscriptionId, tenantId: mockTenantId },
        relations: ['plan'],
      });

      expect(planRepository.findOne).toHaveBeenCalledWith({
        where: { name: PlanName.GROEI, isActive: true },
      });

      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: mockNewPlan.id,
        }),
      );

      expect(auditService.logAction).toHaveBeenCalledWith({
        action: 'SUBSCRIPTION_CHANGED',
        resource_type: 'Subscription',
        resource_id: mockSubscriptionId,
        details: {
          oldPlan: mockCurrentPlan.name,
          newPlan: PlanName.GROEI,
          paymentId: mockPaymentId,
          amount: mockPayment.amount,
        },
        tenant_id: mockTenantId,
      });

      expect(result).toEqual(updatedSubscription);
    });

    it('should throw BadRequestException if payment not completed', async () => {
      // Arrange
      const unpaidPayment = { ...mockPayment, status: 'open' };
      paymentsService.getPayment.mockResolvedValue(unpaidPayment);

      // Act & Assert
      await expect(
        service.completeSubscriptionChange(mockPaymentId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      // Arrange
      paymentsService.getPayment.mockResolvedValue(mockPayment);
      subscriptionRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.completeSubscriptionChange(mockPaymentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if new plan not found', async () => {
      // Arrange
      paymentsService.getPayment.mockResolvedValue(mockPayment);
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription);
      planRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.completeSubscriptionChange(mockPaymentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle yearly billing interval correctly', async () => {
      // Arrange
      const yearlySubscription = {
        ...mockSubscription,
        billingInterval: BillingInterval.YEAR,
      };
      
      paymentsService.getPayment.mockResolvedValue(mockPayment);
      subscriptionRepository.findOne.mockResolvedValue(yearlySubscription);
      planRepository.findOne.mockResolvedValue(mockNewPlan);
      
      const now = new Date();
      const expectedEndDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      const updatedSubscription = {
        ...yearlySubscription,
        planId: mockNewPlan.id,
        currentPeriodStart: now,
        currentPeriodEnd: expectedEndDate,
      };
      subscriptionRepository.save.mockResolvedValue(updatedSubscription);

      // Act
      const result = await service.completeSubscriptionChange(mockPaymentId);

      // Assert
      expect(subscriptionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          planId: mockNewPlan.id,
          billingInterval: BillingInterval.YEAR,
        }),
      );

      expect(result).toEqual(updatedSubscription);
    });
  });
});