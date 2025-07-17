import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { WebhookService } from './webhook.service';
import { WebhookHandlerService } from './webhook-handler.service';
import {
  WebhookEvent,
  WebhookEventStatus,
} from '../entities/webhook-event.entity';
import { AuditService } from '../../audit/audit.service';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

// Mock Stripe module
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webhooks: {
      constructEvent: jest.fn(),
    },
  })),
}));

describe('WebhookService', () => {
  let service: WebhookService;
  let webhookEventRepository: jest.Mocked<Repository<WebhookEvent>>;
  let webhookHandlerService: jest.Mocked<WebhookHandlerService>;
  let auditService: jest.Mocked<AuditService>;
  let mockStripe: any;

  const mockWebhookEvent = {
    id: 'event-123',
    stripe_event_id: 'evt_test_123',
    type: 'customer.subscription.updated',
    payload: {},
    status: WebhookEventStatus.PENDING,
    error_message: null,
    retry_count: 0,
    processed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  } as WebhookEvent;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockStripe = {
      webhooks: {
        constructEvent: jest.fn(),
      },
    };

    const stripeMock = jest.requireMock('stripe');
    stripeMock.default.mockReturnValue(mockStripe);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(WebhookEvent),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test_webhook_secret'),
          },
        },
        {
          provide: WebhookHandlerService,
          useValue: {
            handleEvent: jest.fn(),
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

    service = module.get<WebhookService>(WebhookService);
    webhookEventRepository = module.get(getRepositoryToken(WebhookEvent));
    webhookHandlerService = module.get(WebhookHandlerService);
    auditService = module.get(AuditService);
  });

  describe('handleStripeWebhook', () => {
    const rawBody = Buffer.from('raw-webhook-body');
    const signature = 'test-signature';
    const ipAddress = '127.0.0.1';

    it('should process new webhook successfully', async () => {
      const stripeEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
        data: { object: {} },
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent);
      webhookEventRepository.findOne.mockResolvedValue(null);
      webhookEventRepository.save.mockResolvedValue(mockWebhookEvent);

      await service.handleStripeWebhook(rawBody, signature, ipAddress);

      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
        expect.any(String),
      );
      expect(webhookEventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          stripe_event_id: 'evt_test_123',
          type: 'customer.subscription.updated',
          status: WebhookEventStatus.PENDING,
        }),
      );
      expect(webhookHandlerService.handleEvent).toHaveBeenCalledWith(
        stripeEvent,
      );
    });

    it('should skip duplicate webhook events', async () => {
      const stripeEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent);
      webhookEventRepository.findOne.mockResolvedValue({
        ...mockWebhookEvent,
        status: WebhookEventStatus.COMPLETED,
      } as WebhookEvent);

      await service.handleStripeWebhook(rawBody, signature, ipAddress);

      expect(webhookEventRepository.save).not.toHaveBeenCalled();
      expect(webhookHandlerService.handleEvent).not.toHaveBeenCalled();
    });

    it('should handle webhook processing errors asynchronously', async () => {
      const stripeEvent = {
        id: 'evt_test_123',
        type: 'customer.subscription.updated',
      } as Stripe.Event;

      mockStripe.webhooks.constructEvent.mockReturnValue(stripeEvent);
      webhookEventRepository.findOne.mockResolvedValue(null);
      webhookEventRepository.save.mockResolvedValue(mockWebhookEvent);
      webhookHandlerService.handleEvent.mockRejectedValue(
        new Error('Processing failed'),
      );

      // The method doesn't throw, it processes async
      await service.handleStripeWebhook(rawBody, signature, ipAddress);

      // Wait a bit for async processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(webhookEventRepository.update).toHaveBeenCalledWith(
        mockWebhookEvent.id,
        expect.objectContaining({
          status: WebhookEventStatus.FAILED,
        }),
      );
    });

    it('should throw error for invalid signature', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleStripeWebhook(rawBody, signature, ipAddress),
      ).rejects.toThrow('Invalid webhook signature');

      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'webhook.invalid_signature',
        }),
      );
    });
  });
});
