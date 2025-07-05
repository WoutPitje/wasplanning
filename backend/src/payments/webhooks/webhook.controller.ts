import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from '../payments.service';
import { MollieProvider } from '../providers/mollie/mollie.provider';
import { TransactionStatus } from '../entities/payment-transaction.entity';

@ApiTags('webhooks')
@Controller('payments/webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mollieProvider: MollieProvider,
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

    try {
      // Validate webhook signature
      const isValid = this.mollieProvider.validateWebhook(body, signature);
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

  private async processWebhookEvent(event: any): Promise<void> {
    switch (event.type) {
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
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentPaid(event: any): Promise<void> {
    this.logger.log(`Payment paid: ${event.data.id}`);
    
    try {
      // Get payment details from Mollie
      const payment = await this.mollieProvider.getPayment(event.data.id);
      
      // Update transaction status
      await this.paymentsService.updateTransactionStatus(
        payment.providerId,
        TransactionStatus.COMPLETED,
      );

      this.logger.log(`Payment ${payment.providerId} marked as completed`);
    } catch (error) {
      this.logger.error(`Failed to process payment paid event: ${error.message}`);
    }
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
      
      // TODO: Update local subscription record with provider subscription ID
      this.logger.log(`Subscription ${subscription.providerId} created in Mollie`);
    } catch (error) {
      this.logger.error(`Failed to process subscription created event: ${error.message}`);
    }
  }

  private async handleSubscriptionUpdated(event: any): Promise<void> {
    this.logger.log(`Subscription updated: ${event.data.id}`);
    
    try {
      // Get subscription details from Mollie
      const subscription = await this.mollieProvider.getSubscription(event.data.id);
      
      // TODO: Update local subscription record
      this.logger.log(`Subscription ${subscription.providerId} updated`);
    } catch (error) {
      this.logger.error(`Failed to process subscription updated event: ${error.message}`);
    }
  }

  private async handleSubscriptionCanceled(event: any): Promise<void> {
    this.logger.log(`Subscription canceled: ${event.data.id}`);
    
    try {
      // Get subscription details from Mollie
      const subscription = await this.mollieProvider.getSubscription(event.data.id);
      
      // TODO: Update local subscription status
      this.logger.log(`Subscription ${subscription.providerId} canceled`);
    } catch (error) {
      this.logger.error(`Failed to process subscription canceled event: ${error.message}`);
    }
  }
}