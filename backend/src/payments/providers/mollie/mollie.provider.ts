import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createMollieClient, MollieApiError } from '@mollie/api-client';
import {
  PaymentProvider,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  CreatePaymentMethodParams,
  CreatePaymentParams,
  Subscription,
  PaymentMethod,
  Payment,
  WebhookEvent,
} from '../../interfaces/payment-provider.interface';
import { MollieConfig, mollieConfig } from './mollie.config';
import { MollieCustomer, MolliePayment, MollieSubscription, MollieMandate, MollieWebhookEvent } from './mollie.types';

@Injectable()
export class MollieProvider implements PaymentProvider {
  private readonly logger = new Logger(MollieProvider.name);
  private readonly config: MollieConfig;
  private readonly mollie;

  constructor(private configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('MOLLIE_API_KEY') || 'test_abWq5tSnzuyseaT22rFPVRHG67uCbd',
      webhookUrl: this.configService.get<string>('MOLLIE_WEBHOOK_URL') || mollieConfig.webhookUrl,
      testMode: this.configService.get<string>('NODE_ENV') !== 'production',
    };

    this.mollie = createMollieClient({ apiKey: this.config.apiKey });
    this.logger.log(`Mollie client initialized with ${this.config.testMode ? 'test' : 'live'} API key`);
  }

  async createCustomer(email: string, metadata?: Record<string, any>): Promise<string> {
    this.logger.log(`Creating Mollie customer for email: ${email}`);
    
    try {
      const customer = await this.mollie.customers.create({
        email,
        metadata,
      });
      return customer.id;
    } catch (error) {
      this.logger.error('Failed to create Mollie customer', error);
      throw error;
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    this.logger.log(`Creating Mollie subscription: ${JSON.stringify(params)}`);
    
    try {
      const subscription = await this.mollie.customers_subscriptions.create(params.customerId, {
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency,
        },
        interval: params.interval === 'monthly' ? '1 month' : '1 year',
        description: params.description,
        webhookUrl: this.config.webhookUrl,
        metadata: params.metadata,
      });
      
      return {
        id: subscription.id,
        providerId: subscription.id,
        status: subscription.status as any,
        amount: parseFloat(subscription.amount.value),
        currency: subscription.amount.currency,
        interval: params.interval,
        nextPaymentDate: subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: subscription.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to create Mollie subscription', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async updateSubscription(id: string, params: UpdateSubscriptionParams): Promise<Subscription> {
    this.logger.log(`Updating Mollie subscription ${id}: ${JSON.stringify(params)}`);
    
    try {
      const updateData: any = {};
      
      if (params.amount) {
        updateData.amount = {
          value: params.amount.toFixed(2),
          currency: 'EUR',
        };
      }
      
      if (params.description) {
        updateData.description = params.description;
      }
      
      if (params.metadata) {
        updateData.metadata = params.metadata;
      }
      
      const subscription = await this.mollie.customers_subscriptions.update(id, updateData);
      
      return {
        id: subscription.id,
        providerId: subscription.id,
        status: subscription.status as any,
        amount: parseFloat(subscription.amount.value),
        currency: subscription.amount.currency,
        interval: subscription.interval === '1 month' ? 'monthly' : 'yearly',
        nextPaymentDate: subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: subscription.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to update Mollie subscription', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async cancelSubscription(id: string): Promise<void> {
    this.logger.log(`Canceling Mollie subscription ${id}`);
    
    try {
      await this.mollie.customers_subscriptions.cancel(id);
    } catch (error) {
      this.logger.error('Failed to cancel Mollie subscription', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getSubscription(id: string): Promise<Subscription> {
    this.logger.log(`Getting Mollie subscription ${id}`);
    
    try {
      const subscription = await this.mollie.customers_subscriptions.get(id);
      
      return {
        id: subscription.id,
        providerId: subscription.id,
        status: subscription.status as any,
        amount: parseFloat(subscription.amount.value),
        currency: subscription.amount.currency,
        interval: subscription.interval === '1 month' ? 'monthly' : 'yearly',
        nextPaymentDate: subscription.nextPaymentDate ? new Date(subscription.nextPaymentDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: subscription.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to get Mollie subscription', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethod> {
    this.logger.log(`Creating Mollie payment method: ${JSON.stringify(params)}`);
    
    try {
      const mandate = await this.mollie.customers_mandates.create(params.customerId, {
        method: params.type,
        ...params.details,
      });
      
      return {
        id: mandate.id,
        providerId: mandate.id,
        type: mandate.method as any,
        details: mandate.details || {},
        isDefault: false,
      };
    } catch (error) {
      this.logger.error('Failed to create Mollie payment method', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async deletePaymentMethod(id: string): Promise<void> {
    this.logger.log(`Deleting Mollie payment method ${id}`);
    
    try {
      await this.mollie.customers_mandates.revoke(id);
    } catch (error) {
      this.logger.error('Failed to delete Mollie payment method', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async listPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    this.logger.log(`Listing Mollie payment methods for customer ${customerId}`);
    
    try {
      const mandates = await this.mollie.customers_mandates.list({ customerId });
      
      return mandates.map(mandate => ({
        id: mandate.id,
        providerId: mandate.id,
        type: mandate.method as any,
        details: mandate.details || {},
        isDefault: false,
      }));
    } catch (error) {
      this.logger.error('Failed to list Mollie payment methods', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    this.logger.log(`Creating Mollie payment: ${JSON.stringify(params)}`);
    
    try {
      const payment = await this.mollie.payments.create({
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency,
        },
        description: params.description,
        customerId: params.customerId,
        mandateId: params.paymentMethodId,
        webhookUrl: this.config.webhookUrl,
        metadata: params.metadata,
      });
      
      return {
        id: payment.id,
        providerId: payment.id,
        status: payment.status as any,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
        metadata: payment.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to create Mollie payment', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async createCheckoutPayment(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    redirectUrl: string;
    webhookUrl?: string;
    metadata?: any;
  }): Promise<{ id: string; checkoutUrl: string; status: string }> {
    this.logger.log(`Creating Mollie checkout payment: ${JSON.stringify(params)}`);
    this.logger.log(`Redirect URL being sent to Mollie: ${params.redirectUrl}`);
    
    try {
      const paymentData: any = {
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency,
        },
        description: params.description,
        redirectUrl: params.redirectUrl,
        webhookUrl: params.webhookUrl || this.config.webhookUrl,
        metadata: params.metadata,
      };

      // Only add customerId if provided
      if (params.customerId) {
        paymentData.customerId = params.customerId;
      }

      const payment = await this.mollie.payments.create(paymentData);
      
      // Get the checkout URL from the payment response
      const checkoutUrl = payment._links?.checkout?.href || '';
      
      if (!checkoutUrl) {
        throw new Error('No checkout URL returned from Mollie');
      }
      
      return {
        id: payment.id,
        checkoutUrl,
        status: payment.status,
      };
    } catch (error) {
      this.logger.error('Failed to create Mollie checkout payment', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getPayment(id: string): Promise<Payment> {
    this.logger.log(`Getting Mollie payment ${id}`);
    
    try {
      const payment = await this.mollie.payments.get(id);
      
      return {
        id: payment.id,
        providerId: payment.id,
        status: payment.status as any,
        amount: parseFloat(payment.amount.value),
        currency: payment.amount.currency,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
        metadata: payment.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to get Mollie payment', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  validateWebhook(body: any, signature: string): boolean {
    // TODO: Implement proper webhook signature validation
    // For now, always return true
    this.logger.log('Validating Mollie webhook signature');
    return true;
  }

  parseWebhook(body: any): WebhookEvent {
    this.logger.log(`Parsing Mollie webhook: ${JSON.stringify(body)}`);
    
    // Mollie sends webhooks with just the payment ID
    // We need to determine the event type from the resource type
    let eventType = 'unknown';
    
    if (body.id) {
      if (body.id.startsWith('tr_')) {
        eventType = 'payment.updated';
      } else if (body.id.startsWith('sub_')) {
        eventType = 'subscription.updated';
      }
    }
    
    return {
      id: body.id || 'unknown',
      type: eventType,
      data: body,
      createdAt: new Date(),
    };
  }
}