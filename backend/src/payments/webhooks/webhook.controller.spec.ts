import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { PaymentsService } from '../payments.service';
import { MollieProvider } from '../providers/mollie/mollie.provider';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TransactionStatus } from '../entities/payment-transaction.entity';
import { BadRequestException } from '@nestjs/common';

describe('WebhookController', () => {
  let controller: WebhookController;
  let paymentsService: PaymentsService;
  let mollieProvider: MollieProvider;
  let subscriptionsService: SubscriptionsService;

  const mockPayment = {
    id: 'tr_test123',
    providerId: 'tr_test123',
    status: 'paid',
    amount: 10,
    metadata: {
      tenantId: 'tenant-123',
      action: 'new_subscription',
    },
  };

  const mockSubscription = {
    id: 'sub_test123',
    providerId: 'sub_test123',
    status: 'active',
    metadata: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            updateTransactionStatus: jest.fn(),
            getPayment: jest.fn(),
            getSubscription: jest.fn(),
          },
        },
        {
          provide: MollieProvider,
          useValue: {
            validateWebhook: jest.fn().mockResolvedValue(true),
            parseWebhook: jest.fn(),
            getPayment: jest.fn(),
            getSubscription: jest.fn(),
          },
        },
        {
          provide: SubscriptionsService,
          useValue: {
            completeNewSubscription: jest.fn(),
            completeSubscriptionChange: jest.fn(),
            processRecurringPayment: jest.fn(),
            handleFailedPayment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    paymentsService = module.get<PaymentsService>(PaymentsService);
    mollieProvider = module.get<MollieProvider>(MollieProvider);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMollieWebhook', () => {
    it('should process payment.updated webhook successfully', async () => {
      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(mockPayment);

      const result = await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(result).toEqual({ status: 'ok' });
      expect(mollieProvider.validateWebhook).toHaveBeenCalledWith(webhookBody, 'signature');
      expect(paymentsService.updateTransactionStatus).toHaveBeenCalledWith(
        'tr_test123',
        TransactionStatus.COMPLETED
      );
    });

    it('should handle new subscription payment', async () => {
      const paymentWithSubscriptionMetadata = {
        ...mockPayment,
        metadata: {
          ...mockPayment.metadata,
          action: 'subscription_mandate_setup',
        },
      };

      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(paymentWithSubscriptionMetadata);

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(subscriptionsService.completeNewSubscription).toHaveBeenCalledWith('tr_test123');
    });

    it('should handle subscription change payment', async () => {
      const paymentWithChangeMetadata = {
        ...mockPayment,
        metadata: {
          ...mockPayment.metadata,
          action: 'subscription_change',
        },
      };

      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(paymentWithChangeMetadata);

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(subscriptionsService.completeSubscriptionChange).toHaveBeenCalledWith('tr_test123');
    });

    it('should reject invalid webhook signature', async () => {
      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(false);

      await expect(
        controller.handleMollieWebhook({ id: 'tr_test123' }, 'invalid_signature')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('subscription webhooks', () => {
    it('should handle subscription.updated webhook', async () => {
      const webhookBody = { id: 'sub_test123' };
      const webhookEvent = {
        id: 'sub_test123',
        type: 'subscription.updated',
        data: { id: 'sub_test123' },
        createdAt: new Date(),
      };

      const mockLocalSubscription = {
        id: 'local-sub-123',
        mollieSubscriptionId: 'sub_test123',
        mollieCustomerId: 'cst_test123',
        status: 'active',
        metadata: {},
      };

      const mockMollieSubscription = {
        ...mockSubscription,
        status: 'canceled',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockLocalSubscription),
        save: jest.fn().mockResolvedValue({
          ...mockLocalSubscription,
          status: 'canceled',
        }),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getSubscription as jest.Mock).mockResolvedValue(mockMollieSubscription);
      (paymentsService as any).transactionRepository = {
        manager: {
          getRepository: jest.fn().mockReturnValue(mockRepo),
        },
      };

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'canceled',
        })
      );
    });

    it('should handle subscription payment paid webhook', async () => {
      const webhookBody = { id: 'tr_sub_payment123' };
      const webhookEvent = {
        id: 'tr_sub_payment123',
        type: 'subscription.payment_paid',
        data: { id: 'tr_sub_payment123' },
        createdAt: new Date(),
      };

      const mockPaymentWithSubscription = {
        ...mockPayment,
        subscriptionId: 'sub_test123',
      };

      const mockLocalSubscription = {
        id: 'local-sub-123',
        mollieSubscriptionId: 'sub_test123',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockLocalSubscription),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(mockPaymentWithSubscription);
      (paymentsService as any).transactionRepository = {
        manager: {
          getRepository: jest.fn().mockReturnValue(mockRepo),
        },
      };

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(subscriptionsService.processRecurringPayment).toHaveBeenCalledWith(
        'local-sub-123',
        'tr_test123',
        10
      );
    });

    it('should handle subscription payment failed webhook', async () => {
      const webhookBody = { id: 'tr_sub_payment123' };
      const webhookEvent = {
        id: 'tr_sub_payment123',
        type: 'subscription.payment_failed',
        data: { id: 'tr_sub_payment123' },
        createdAt: new Date(),
      };

      const mockPaymentWithSubscription = {
        ...mockPayment,
        status: 'failed',
        subscriptionId: 'sub_test123',
      };

      const mockLocalSubscription = {
        id: 'local-sub-123',
        mollieSubscriptionId: 'sub_test123',
      };

      const mockRepo = {
        findOne: jest.fn().mockResolvedValue(mockLocalSubscription),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(mockPaymentWithSubscription);
      (paymentsService as any).transactionRepository = {
        manager: {
          getRepository: jest.fn().mockReturnValue(mockRepo),
        },
      };

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(subscriptionsService.handleFailedPayment).toHaveBeenCalledWith(
        'local-sub-123',
        'tr_test123'
      );
    });
  });

  describe('testMollieWebhook', () => {
    it('should process test webhook successfully', async () => {
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(mockPayment);

      const result = await controller.testMollieWebhook('tr_test123');

      expect(result).toEqual({
        status: 'ok',
        message: 'Test webhook processed successfully',
      });
    });
  });

  describe('payment status handling', () => {
    it('should handle failed payment status', async () => {
      const failedPayment = { ...mockPayment, status: 'failed' };
      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(failedPayment);

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(paymentsService.updateTransactionStatus).toHaveBeenCalledWith(
        'tr_test123',
        TransactionStatus.FAILED
      );
    });

    it('should handle canceled payment status', async () => {
      const canceledPayment = { ...mockPayment, status: 'canceled' };
      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(canceledPayment);

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(paymentsService.updateTransactionStatus).toHaveBeenCalledWith(
        'tr_test123',
        TransactionStatus.CANCELED
      );
    });

    it('should handle expired payment status', async () => {
      const expiredPayment = { ...mockPayment, status: 'expired' };
      const webhookBody = { id: 'tr_test123' };
      const webhookEvent = {
        id: 'tr_test123',
        type: 'payment.updated',
        data: { id: 'tr_test123' },
        createdAt: new Date(),
      };

      (mollieProvider.validateWebhook as jest.Mock).mockResolvedValue(true);
      (mollieProvider.parseWebhook as jest.Mock).mockReturnValue(webhookEvent);
      (mollieProvider.getPayment as jest.Mock).mockResolvedValue(expiredPayment);

      await controller.handleMollieWebhook(webhookBody, 'signature');

      expect(paymentsService.updateTransactionStatus).toHaveBeenCalledWith(
        'tr_test123',
        TransactionStatus.FAILED
      );
    });
  });
});