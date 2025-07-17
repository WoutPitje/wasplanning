import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookHandlerService } from './webhook-handler.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { Tenant } from '../../auth/entities/tenant.entity';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import Stripe from 'stripe';

describe('WebhookHandlerService', () => {
  let service: WebhookHandlerService;
  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;
  let auditService: jest.Mocked<AuditService>;
  let emailService: jest.Mocked<EmailService>;

  const mockSubscription = {
    id: 'sub-123',
    tenant_id: 'tenant-123',
    stripe_subscription_id: 'sub_stripe_123',
    status: SubscriptionStatus.ACTIVE,
    payment_failure_count: 0,
    payment_failed_at: null,
    grace_period_end: null,
    tenant: {
      id: 'tenant-123',
      name: 'Test Garage',
    },
    plan: {
      id: 'plan-123',
      name: 'standard',
      display_name: 'Standard Plan',
    },
  };

  const mockAdminUser = {
    id: 'user-123',
    email: 'admin@testgarage.com',
    first_name: 'John',
    role: UserRole.GARAGE_ADMIN,
    tenant_id: 'tenant-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookHandlerService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            logAction: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPaymentFailedEmail: jest.fn(),
            sendPaymentSucceededAfterFailureEmail: jest.fn(),
            sendSubscriptionCanceledEmail: jest.fn(),
            sendGracePeriodWarningEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookHandlerService>(WebhookHandlerService);
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
    userRepository = module.get(getRepositoryToken(User));
    tenantRepository = module.get(getRepositoryToken(Tenant));
    auditService = module.get(AuditService);
    emailService = module.get(EmailService);
  });

  describe('handleEvent', () => {
    it('should route invoice.payment_succeeded event correctly', async () => {
      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_paid: 10000,
            currency: 'eur',
          },
        },
      } as any as Stripe.Event;

      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as any);
      userRepository.find.mockResolvedValue([]);
      subscriptionRepository.update.mockResolvedValue({} as any);

      await service.handleEvent(event);

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { stripe_subscription_id: 'sub_stripe_123' },
        relations: ['tenant'],
      });
    });

    it('should route invoice.payment_failed event correctly', async () => {
      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_due: 10000,
            currency: 'eur',
            attempt_count: 1,
          },
        },
      } as any as Stripe.Event;

      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as any);
      userRepository.find.mockResolvedValue([mockAdminUser] as any);
      subscriptionRepository.update.mockResolvedValue({} as any);

      await service.handleEvent(event);

      expect(subscriptionRepository.findOne).toHaveBeenCalledWith({
        where: { stripe_subscription_id: 'sub_stripe_123' },
        relations: ['tenant'],
      });
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    it('should clear failure state when payment succeeds after failure', async () => {
      const failedSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
        payment_failure_count: 2,
        payment_failed_at: new Date(),
        grace_period_end: new Date(),
      };

      subscriptionRepository.findOne.mockResolvedValue(
        failedSubscription as any,
      );
      userRepository.find.mockResolvedValue([mockAdminUser] as any);

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_paid: 10000,
            currency: 'eur',
          },
        },
      } as any as Stripe.Event;

      await service.handleEvent(event);

      expect(subscriptionRepository.update).toHaveBeenCalledWith('sub-123', {
        status: SubscriptionStatus.ACTIVE,
        payment_failure_count: 0,
        payment_failed_at: null,
        grace_period_end: null,
      });

      expect(
        emailService.sendPaymentSucceededAfterFailureEmail,
      ).toHaveBeenCalledWith('admin@testgarage.com', {
        firstName: 'John',
        tenantName: 'Test Garage',
        amount: 100,
        currency: 'EUR',
      });
    });

    it('should not send recovery email for successful payment without prior failure', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as any);
      userRepository.find.mockResolvedValue([mockAdminUser] as any);

      const event = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_paid: 10000,
            currency: 'eur',
          },
        },
      } as any as Stripe.Event;

      await service.handleEvent(event);

      expect(
        emailService.sendPaymentSucceededAfterFailureEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    it('should track first payment failure and set grace period', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as any);
      userRepository.find.mockResolvedValue([mockAdminUser] as any);

      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_due: 10000,
            currency: 'eur',
            attempt_count: 1,
          },
        },
      } as any as Stripe.Event;

      await service.handleEvent(event);

      expect(subscriptionRepository.update).toHaveBeenCalledWith('sub-123', {
        status: SubscriptionStatus.PAST_DUE,
        payment_failure_count: 1,
        payment_failed_at: expect.any(Date),
        grace_period_end: expect.any(Date),
      });

      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        'admin@testgarage.com',
        {
          firstName: 'John',
          tenantName: 'Test Garage',
          amount: 100,
          currency: 'EUR',
          attemptCount: 1,
          nextRetryDate: expect.any(Date),
        },
      );
    });

    it('should send grace period warning when approaching end', async () => {
      const nearEndGracePeriod = new Date();
      nearEndGracePeriod.setDate(nearEndGracePeriod.getDate() + 5); // 5 days remaining

      const failingSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
        payment_failure_count: 2,
        payment_failed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        grace_period_end: nearEndGracePeriod,
      };

      subscriptionRepository.findOne.mockResolvedValue(
        failingSubscription as any,
      );
      userRepository.find.mockResolvedValue([mockAdminUser] as any);

      const event = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'inv_123',
            subscription: 'sub_stripe_123',
            amount_due: 10000,
            currency: 'eur',
            attempt_count: 3,
          },
        },
      } as any as Stripe.Event;

      await service.handleEvent(event);

      expect(emailService.sendGracePeriodWarningEmail).toHaveBeenCalledWith(
        'admin@testgarage.com',
        {
          firstName: 'John',
          tenantName: 'Test Garage',
          gracePeriodEnd: nearEndGracePeriod,
          daysRemaining: expect.any(Number),
        },
      );
    });
  });

  describe('handleSubscriptionDeleted', () => {
    it('should send cancellation email', async () => {
      subscriptionRepository.findOne.mockResolvedValue(mockSubscription as any);
      userRepository.find.mockResolvedValue([mockAdminUser] as any);

      const event = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_123',
            current_period_end: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
          },
        },
      } as any as Stripe.Event;

      await service.handleEvent(event);

      expect(subscriptionRepository.update).toHaveBeenCalledWith('sub-123', {
        status: SubscriptionStatus.CANCELED,
        canceled_at: expect.any(Date),
      });

      expect(emailService.sendSubscriptionCanceledEmail).toHaveBeenCalledWith(
        'admin@testgarage.com',
        {
          firstName: 'John',
          tenantName: 'Test Garage',
          planName: 'Standard Plan',
          endDate: expect.any(Date),
        },
      );
    });
  });
});
