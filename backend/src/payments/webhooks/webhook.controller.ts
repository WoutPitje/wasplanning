import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from '../payments.service';
import { MollieProvider } from '../providers/mollie/mollie.provider';
import { TransactionStatus } from '../entities/payment-transaction.entity';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

@ApiTags('webhooks')
@Controller('payments/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mollieProvider: MollieProvider,
    @Inject(forwardRef(() => SubscriptionsService))
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('mollie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Mollie webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleMollieWebhook(
    @Body() body: any,
    @Headers('mollie-signature') signature: string,
  ) {
    this.logger.log('Received Mollie webhook');
    this.logger.log(`Webhook body: ${JSON.stringify(body)}`);

    try {
      // Validate webhook signature
      const isValid = await this.mollieProvider.validateWebhook(body, signature);
      if (!isValid) {
        this.logger.error('Invalid Mollie webhook signature');
        throw new BadRequestException('Invalid webhook signature');
      }

      // Parse webhook event
      const event = this.mollieProvider.parseWebhook(body);
      this.logger.log(`Processing Mollie webhook event: ${event.type}`);

      await this.processWebhookEvent(event);

      return { status: 'ok' };
    } catch (error) {
      this.logger.error(`Failed to process Mollie webhook: ${error.message}`);
      throw error;
    }
  }

  @Post('mollie/test/:paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test webhook processing manually' })
  @ApiResponse({ status: 200, description: 'Test webhook processed successfully' })
  async testMollieWebhook(@Param('paymentId') paymentId: string) {
    this.logger.log(`Testing webhook for payment ${paymentId}`);

    try {
      // Create a test webhook event
      const event = {
        id: paymentId,
        type: 'payment.updated',
        data: { id: paymentId },
        createdAt: new Date(),
      };

      await this.processWebhookEvent(event);

      return { status: 'ok', message: 'Test webhook processed successfully' };
    } catch (error) {
      this.logger.error(`Failed to process test webhook: ${error.message}`);
      throw error;
    }
  }

  private async processWebhookEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'payment.updated':
        // Mollie sends a generic update event, we need to check the status
        await this.handlePaymentUpdated(event);
        break;
      case 'payment.paid':
        await this.handlePaymentPaid(event);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;
      case 'payment.canceled':
        await this.handlePaymentCanceled(event);
        break;
      case 'subscription.created':
        await this.handleSubscriptionCreated(event);
        break;
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'subscription.canceled':
        await this.handleSubscriptionCanceled(event);
        break;
      case 'subscription.payment_paid':
        await this.handleSubscriptionPaymentPaid(event);
        break;
      case 'subscription.payment_failed':
        await this.handleSubscriptionPaymentFailed(event);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentUpdated(event: any): Promise<void> {
    this.logger.log(`Payment updated: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      this.logger.log(`Payment ${payment.providerId} status: ${payment.status}`);
      
      // Handle based on the actual payment status
      switch (payment.status) {
        case 'paid':
          await this.handlePaymentPaidStatus(payment);
          break;
        case 'failed':
          await this.updateTransactionStatus(payment.providerId, TransactionStatus.FAILED);
          break;
        case 'canceled':
          await this.updateTransactionStatus(payment.providerId, TransactionStatus.CANCELED);
          break;
        // Mollie can return 'expired' status which we treat as failed
        case 'expired' as any:
          await this.updateTransactionStatus(payment.providerId, TransactionStatus.FAILED);
          break;
        default:
          this.logger.log(`Payment ${payment.providerId} has status ${payment.status}, no action needed`);
      }
    } catch (error) {
      this.logger.error(`Failed to process payment updated event: ${error.message}`);
    }
  }

  private async handlePaymentPaidStatus(payment: any): Promise<void> {
    this.logger.log(`Processing paid payment: ${payment.providerId}`);
    
    try {
      // Update transaction status
      await this.updateTransactionStatus(payment.providerId, TransactionStatus.COMPLETED);

      this.logger.log(`Payment ${payment.providerId} marked as completed`);
      
      // Check if this payment is for a subscription action
      if (payment.metadata) {
        const { action } = payment.metadata;
        
        if (action === 'new_subscription' || action === 'subscription_mandate_setup') {
          // Handle new subscription creation or mandate setup
          this.logger.log(`Processing ${action} payment`);
          try {
            await this.subscriptionsService.completeNewSubscription(payment.providerId);
            this.logger.log(`Successfully completed new subscription for payment ${payment.providerId}`);
          } catch (error) {
            this.logger.error(`Failed to complete new subscription: ${error.message}`);
            // Don't throw - we've already marked the payment as completed
          }
        } else if (action === 'subscription_change') {
          // Handle subscription plan change
          this.logger.log('Processing subscription change payment');
          try {
            await this.subscriptionsService.completeSubscriptionChange(payment.providerId);
            this.logger.log(`Successfully completed subscription change for payment ${payment.providerId}`);
          } catch (error) {
            this.logger.error(`Failed to complete subscription change: ${error.message}`);
            // Don't throw - we've already marked the payment as completed
          }
        } else if (action === 'overdue_payment') {
          // Handle overdue payment
          this.logger.log('Processing overdue payment');
          // The subscription service will handle this through normal payment completion
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process paid payment: ${error.message}`);
    }
  }

  private async updateTransactionStatus(
    providerTransactionId: string,
    status: TransactionStatus,
  ): Promise<void> {
    await this.paymentsService.updateTransactionStatus(providerTransactionId, status);
  }

  private async handlePaymentPaid(event: any): Promise<void> {
    // This is kept for compatibility but delegates to handlePaymentUpdated
    // since Mollie typically sends payment.updated events
    await this.handlePaymentUpdated(event);
  }

  private async handlePaymentFailed(event: any): Promise<void> {
    this.logger.log(`Payment failed: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      // Update transaction status
      await this.paymentsService.updateTransactionStatus(
        payment.providerId,
        TransactionStatus.FAILED,
      );

      this.logger.log(`Payment ${payment.providerId} marked as failed`);
    } catch (error) {
      this.logger.error(`Failed to process payment failed event: ${error.message}`);
    }
  }

  private async handlePaymentCanceled(event: any): Promise<void> {
    this.logger.log(`Payment canceled: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      // Update transaction status
      await this.paymentsService.updateTransactionStatus(
        payment.providerId,
        TransactionStatus.CANCELED,
      );

      this.logger.log(`Payment ${payment.providerId} marked as canceled`);
    } catch (error) {
      this.logger.error(`Failed to process payment canceled event: ${error.message}`);
    }
  }

  private async handleSubscriptionCreated(event: any): Promise<void> {
    this.logger.log(`Subscription created: ${event.data.id}`);
    
    try {
      // Get subscription details from Mollie
      const subscription = await this.mollieProvider.getSubscription(event.data.id);
      
      // This event is rarely used as subscriptions are created synchronously
      this.logger.log(`Subscription ${subscription.providerId} created in Mollie`);
      
      // Update local record if needed
      if (subscription.metadata?.subscriptionId) {
        const subscriptionRepo = this.paymentsService['transactionRepository'].manager.getRepository('Subscription');
        await subscriptionRepo.update(
          { id: subscription.metadata.subscriptionId },
          { 
            mollieSubscriptionId: subscription.providerId,
            metadata: {
              mollieStatus: subscription.status,
              createdViaWebhook: true,
            }
          }
        );
      }
    } catch (error) {
      this.logger.error(`Failed to process subscription created event: ${error.message}`);
    }
  }

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    this.logger.log(`Subscription updated: ${event.data.id}`);
    
    try {
      // For Mollie, we need to fetch the subscription to see what changed
      // The subscription ID format is sub_xxxxx
      const mollieSubscriptionId = event.data.id;
      
      // Find local subscription by Mollie ID
      const subscriptionRepo = this.paymentsService['transactionRepository'].manager.getRepository('Subscription');
      const localSubscription = await subscriptionRepo.findOne({
        where: { mollieSubscriptionId },
        relations: ['plan'],
      });
      
      if (!localSubscription) {
        this.logger.warn(`No local subscription found for Mollie subscription ${mollieSubscriptionId}`);
        return;
      }
      
      // Get updated details from Mollie
      const mollieSubscription = await this.mollieProvider.getSubscription(
        mollieSubscriptionId,
        localSubscription.mollieCustomerId
      );
      
      // Update local subscription based on Mollie status
      const previousStatus = localSubscription.status;
      
      switch (mollieSubscription.status) {
        case 'active':
          localSubscription.status = 'active' as any;
          localSubscription.nextPaymentDate = mollieSubscription.nextPaymentDate;
          break;
        case 'canceled':
        case 'cancelled':
          localSubscription.status = 'canceled' as any;
          localSubscription.canceledAt = new Date();
          break;
        case 'suspended':
        case 'paused':
          localSubscription.status = 'past_due' as any;
          break;
        case 'completed':
          localSubscription.status = 'canceled' as any;
          localSubscription.metadata.completedAt = new Date().toISOString();
          break;
      }
      
      localSubscription.metadata.mollieStatus = mollieSubscription.status;
      localSubscription.metadata.lastWebhookUpdate = new Date().toISOString();
      
      await subscriptionRepo.save(localSubscription);
      
      this.logger.log(`Updated subscription ${localSubscription.id} status from ${previousStatus} to ${localSubscription.status}`);
    } catch (error) {
      this.logger.error(`Failed to process subscription updated event: ${error.message}`);
    }
  }

  private async handleSubscriptionCanceled(event: any): Promise<void> {
    this.logger.log(`Subscription canceled: ${event.data.id}`);
    
    try {
      const mollieSubscriptionId = event.data.id;
      
      // Find local subscription by Mollie ID
      const subscriptionRepo = this.paymentsService['transactionRepository'].manager.getRepository('Subscription');
      const localSubscription = await subscriptionRepo.findOne({
        where: { mollieSubscriptionId },
      });
      
      if (!localSubscription) {
        this.logger.warn(`No local subscription found for canceled Mollie subscription ${mollieSubscriptionId}`);
        return;
      }
      
      // Update local subscription status
      localSubscription.status = 'canceled' as any;
      localSubscription.canceledAt = new Date();
      localSubscription.metadata.canceledViaWebhook = true;
      localSubscription.metadata.canceledAt = new Date().toISOString();
      
      await subscriptionRepo.save(localSubscription);
      
      this.logger.log(`Marked subscription ${localSubscription.id} as canceled via webhook`);
    } catch (error) {
      this.logger.error(`Failed to process subscription canceled event: ${error.message}`);
    }
  }

  private async handleSubscriptionPaymentPaid(event: any): Promise<void> {
    this.logger.log(`Subscription payment paid: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      // For subscription payments, Mollie includes subscriptionId in the payment object
      // We need to find the local subscription by Mollie subscription ID
      if (payment.metadata?.subscriptionId || payment.subscriptionId) {
        const mollieSubscriptionId = payment.subscriptionId || payment.metadata?.subscriptionId;
        
        // Find local subscription
        const subscriptionRepo = this.paymentsService['transactionRepository'].manager.getRepository('Subscription');
        const localSubscription = await subscriptionRepo.findOne({
          where: { mollieSubscriptionId },
        });
        
        if (localSubscription) {
          this.logger.log(`Processing recurring payment for subscription ${localSubscription.id}`);
          
          // Update subscription period
          await this.subscriptionsService.processRecurringPayment(
            localSubscription.id,
            payment.providerId,
            payment.amount,
          );
          
          this.logger.log(`Recurring payment processed for subscription ${localSubscription.id}`);
        } else {
          this.logger.warn(`No local subscription found for Mollie subscription ${mollieSubscriptionId}`);
        }
      } else {
        this.logger.warn(`Subscription payment ${payment.providerId} has no subscription ID`);
      }
    } catch (error) {
      this.logger.error(`Failed to process subscription payment paid event: ${error.message}`);
    }
  }

  private async handleSubscriptionPaymentFailed(event: any): Promise<void> {
    this.logger.log(`Subscription payment failed: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      // For subscription payments, find the local subscription
      if (payment.metadata?.subscriptionId || payment.subscriptionId) {
        const mollieSubscriptionId = payment.subscriptionId || payment.metadata?.subscriptionId;
        
        // Find local subscription
        const subscriptionRepo = this.paymentsService['transactionRepository'].manager.getRepository('Subscription');
        const localSubscription = await subscriptionRepo.findOne({
          where: { mollieSubscriptionId },
        });
        
        if (localSubscription) {
          this.logger.log(`Marking subscription ${localSubscription.id} as past due`);
          
          await this.subscriptionsService.handleFailedPayment(
            localSubscription.id,
            payment.providerId,
          );
          
          this.logger.log(`Failed payment handled for subscription ${localSubscription.id}`);
        } else {
          this.logger.warn(`No local subscription found for failed payment on Mollie subscription ${mollieSubscriptionId}`);
        }
      } else {
        this.logger.warn(`Subscription payment failed ${payment.providerId} has no subscription ID`);
      }
    } catch (error) {
      this.logger.error(`Failed to process subscription payment failed event: ${error.message}`);
    }
  }

}