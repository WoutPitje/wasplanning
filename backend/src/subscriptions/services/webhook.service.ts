import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  WebhookEvent,
  WebhookEventStatus,
} from '../entities/webhook-event.entity';
import { AuditService } from '../../audit/audit.service';
import { WebhookHandlerService } from './webhook-handler.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    private configService: ConfigService,
    private auditService: AuditService,
    private webhookHandlerService: WebhookHandlerService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';

    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });

    if (!this.webhookSecret) {
      this.logger.warn('Stripe webhook secret not configured');
    }
  }

  /**
   * Handle incoming Stripe webhook
   */
  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string,
    ipAddress: string,
  ): Promise<void> {
    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed', error);

      // Audit log the invalid signature attempt
      await this.auditService.logAction({
        tenant_id: null,
        user_id: null,
        action: 'webhook.invalid_signature',
        resource_type: 'webhook',
        resource_id: null,
        details: {
          error: error.message,
          ip_address: ipAddress,
        },
        ip_address: ipAddress,
        user_agent: 'Stripe Webhook',
      });

      throw new Error('Invalid webhook signature');
    }

    // Check for idempotency
    const existingEvent = await this.webhookEventRepository.findOne({
      where: { stripe_event_id: event.id },
    });

    if (existingEvent) {
      this.logger.log(`Duplicate webhook event received: ${event.id}`);
      return; // Already processed
    }

    // Store event for idempotency
    const webhookEvent = await this.webhookEventRepository.save({
      stripe_event_id: event.id,
      type: event.type,
      payload: event,
      status: WebhookEventStatus.PENDING,
    });

    // Log webhook received
    await this.auditService.logAction({
      tenant_id: null, // Will be determined from event data
      user_id: null,
      action: 'webhook.received',
      resource_type: 'webhook_event',
      resource_id: webhookEvent.id,
      details: {
        stripe_event_id: event.id,
        event_type: event.type,
        ip_address: ipAddress,
      },
      ip_address: ipAddress,
      user_agent: 'Stripe Webhook',
    });

    // Process asynchronously
    this.processWebhookAsync(webhookEvent, event);
  }

  /**
   * Process webhook asynchronously
   */
  private async processWebhookAsync(
    webhookEvent: WebhookEvent,
    stripeEvent: Stripe.Event,
  ): Promise<void> {
    try {
      // Update status to processing
      await this.webhookEventRepository.update(webhookEvent.id, {
        status: WebhookEventStatus.PROCESSING,
      });

      // Route to appropriate handler
      await this.webhookHandlerService.handleEvent(stripeEvent);

      // Mark as completed
      await this.webhookEventRepository.update(webhookEvent.id, {
        status: WebhookEventStatus.COMPLETED,
        processed_at: new Date(),
      });

      // Log success
      await this.auditService.logAction({
        tenant_id: null,
        user_id: null,
        action: 'webhook.processed',
        resource_type: 'webhook_event',
        resource_id: webhookEvent.id,
        details: {
          stripe_event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          processing_time_ms: Date.now() - webhookEvent.created_at.getTime(),
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      this.logger.log(
        `Successfully processed webhook event: ${stripeEvent.id} (${stripeEvent.type})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process webhook event: ${stripeEvent.id}`,
        error,
      );

      // Update failure status
      await this.webhookEventRepository.update(webhookEvent.id, {
        status: WebhookEventStatus.FAILED,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        retry_count: webhookEvent.retry_count + 1,
      });

      // Log failure
      await this.auditService.logAction({
        tenant_id: null,
        user_id: null,
        action: 'webhook.failed',
        resource_type: 'webhook_event',
        resource_id: webhookEvent.id,
        details: {
          stripe_event_id: stripeEvent.id,
          event_type: stripeEvent.type,
          error: error instanceof Error ? error.message : 'Unknown error',
          retry_count: webhookEvent.retry_count + 1,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      // Optionally implement retry logic here
      if (webhookEvent.retry_count < 3) {
        // Schedule retry
        setTimeout(
          () => {
            this.processWebhookAsync(webhookEvent, stripeEvent);
          },
          Math.pow(2, webhookEvent.retry_count) * 1000,
        ); // Exponential backoff
      }
    }
  }

  /**
   * Log suspicious webhook activity
   */
  async logSuspiciousActivity(
    ipAddress: string,
    activityType: string,
    details: any,
  ): Promise<void> {
    await this.auditService.logAction({
      tenant_id: null,
      user_id: null,
      action: 'webhook.suspicious_activity',
      resource_type: 'webhook',
      resource_id: null,
      details: {
        activity_type: activityType,
        ip_address: ipAddress,
        ...details,
      },
      ip_address: ipAddress,
      user_agent: 'Unknown',
    });

    this.logger.warn(
      `Suspicious webhook activity from ${ipAddress}: ${activityType}`,
    );
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(id: string): Promise<WebhookEvent | null> {
    return this.webhookEventRepository.findOne({ where: { id } });
  }

  /**
   * Get webhook events with pagination
   */
  async getWebhookEvents(
    page: number = 1,
    limit: number = 20,
    status?: WebhookEventStatus,
  ): Promise<{
    data: WebhookEvent[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.webhookEventRepository.createQueryBuilder('event');

    if (status) {
      query.where('event.status = :status', { status });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('event.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retry failed webhook events
   */
  async retryFailedEvents(): Promise<number> {
    const failedEvents = await this.webhookEventRepository.find({
      where: {
        status: WebhookEventStatus.FAILED,
        retry_count: { $lt: 3 } as any, // Less than 3 retries
      },
      order: { created_at: 'ASC' },
      take: 10, // Process 10 at a time
    });

    let retryCount = 0;
    for (const event of failedEvents) {
      try {
        await this.processWebhookAsync(event, event.payload);
        retryCount++;
      } catch (error) {
        this.logger.error(`Failed to retry webhook event ${event.id}`, error);
      }
    }

    return retryCount;
  }
}
