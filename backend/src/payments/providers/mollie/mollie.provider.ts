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
  private readonly mollieClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('MOLLIE_API_KEY', '');
    
    if (!apiKey) {
      throw new Error('MOLLIE_API_KEY is not configured. Please set it in your environment variables.');
    }
    
    this.config = {
      apiKey,
      webhookUrl: this.configService.get<string>('MOLLIE_WEBHOOK_URL') || mollieConfig.webhookUrl,
      testMode: this.configService.get<string>('NODE_ENV') !== 'production',
    };

    this.mollie = createMollieClient({ apiKey: this.config.apiKey });
    this.mollieClient = this.mollie;
    this.logger.log(`Mollie client initialized with ${this.config.testMode ? 'test' : 'live'} API key`);
  }

  async createCustomer(email: string, name?: string, metadata?: Record<string, any>): Promise<string> {
    this.logger.log(`Creating Mollie customer for email: ${email}`);
    
    try {
      const customerData: any = {
        email,
        metadata,
      };
      
      if (name) {
        customerData.name = name;
      }
      
      const customer = await this.mollie.customers.create(customerData);
      return customer.id;
    } catch (error) {
      this.logger.error('Failed to create Mollie customer', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<any> {
    try {
      return await this.mollie.customers.get(customerId);
    } catch (error) {
      this.logger.error('Failed to get Mollie customer', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async listMandates(customerId: string): Promise<any[]> {
    try {
      const mandates = await this.mollie.customers_mandates.page({ customerId });
      return mandates.filter(m => m.status === 'valid');
    } catch (error) {
      this.logger.error('Failed to list Mollie mandates', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    this.logger.log(`Creating Mollie subscription: ${JSON.stringify(params)}`);
    
    try {
      // First check if customer exists
      const customer = await this.mollie.customers.get(params.customerId);
      if (!customer) {
        throw new Error(`Customer ${params.customerId} not found`);
      }

      // Check if customer has valid mandate
      const mandates = await this.mollie.customers_mandates.page({ customerId: params.customerId });
      const validMandate = mandates.find(m => m.status === 'valid');
      
      if (!validMandate) {
        throw new Error('Customer has no valid payment mandate. Please set up a payment method first.');
      }

      const subscription = await this.mollie.customers_subscriptions.create({
        customerId: params.customerId,
        amount: {
          value: params.amount.toFixed(2),
          currency: params.currency,
        },
        times: params.times, // Optional: number of charges for the subscription
        interval: params.interval === 'monthly' ? '1 month' : '1 year',
        description: params.description,
        mandateId: params.mandateId || validMandate.id,
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
      // Get subscription first to get customer ID
      const existingSubscription = await this.mollie.customers_subscriptions.get(id, {
        include: ['customer'],
      });

      const updateData: any = {};
      
      if (params.amount !== undefined) {
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
      
      const subscription = await this.mollie.customers_subscriptions.update(
        existingSubscription.customerId,
        id,
        updateData
      );
      
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
      // Get subscription first to get customer ID
      const subscription = await this.mollie.customers_subscriptions.get(id, {
        include: ['customer'],
      });
      
      await this.mollie.customers_subscriptions.cancel(
        subscription.customerId,
        id
      );
    } catch (error) {
      this.logger.error('Failed to cancel Mollie subscription', error);
      if (error instanceof MollieApiError) {
        throw new Error(`Mollie API Error: ${error.message}`);
      }
      throw error;
    }
  }

  async getSubscription(id: string, customerId?: string): Promise<Subscription> {
    this.logger.log(`Getting Mollie subscription ${id}`);
    
    try {
      let subscription;
      
      if (customerId) {
        subscription = await this.mollie.customers_subscriptions.get(
          customerId,
          id
        );
      } else {
        // Try to get subscription with all customers (less efficient)
        const customers = await this.mollie.customers.page();
        for (const customer of customers) {
          try {
            subscription = await this.mollie.customers_subscriptions.get(
              customer.id,
              id
            );
            if (subscription) break;
          } catch (e) {
            // Continue searching
          }
        }
        
        if (!subscription) {
          throw new Error(`Subscription ${id} not found`);
        }
      }
      
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
      // For Mollie, we need to create a first payment to establish a mandate
      // This is typically done through a checkout flow
      throw new Error('Payment method creation requires a checkout flow. Use createCheckoutPayment with sequenceType: "first"');
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
    sequenceType?: 'first' | 'recurring' | 'oneoff';
    mandateId?: string;
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

      // Add customer and mandate info for subscription setup
      if (params.customerId) {
        paymentData.customerId = params.customerId;
        
        // Set sequence type for mandate creation
        if (params.sequenceType) {
          paymentData.sequenceType = params.sequenceType;
        }
        
        // Use existing mandate if provided
        if (params.mandateId) {
          paymentData.mandateId = params.mandateId;
        }
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

  async validateWebhook(body: any, signature: string): Promise<boolean> {
    // Mollie doesn't use webhook signatures in the same way as other providers
    // Instead, they recommend verifying the webhook by fetching the resource
    // from their API using the ID provided in the webhook
    this.logger.log('Validating Mollie webhook - verifying by fetching resource');
    
    if (!body || !body.id) {
      this.logger.error('Invalid webhook body: missing id');
      return false;
    }

    try {
      // Verify the webhook by fetching the resource from Mollie
      // This ensures the webhook is legitimate
      if (body.id.startsWith('tr_')) {
        // Payment webhook
        const payment = await this.mollieClient.payments.get(body.id);
        return !!payment;
      } else if (body.id.startsWith('sub_')) {
        // Subscription webhook
        const subscription = await this.mollieClient.subscriptions.get(body.id);
        return !!subscription;
      } else if (body.id.startsWith('re_')) {
        // Refund webhook
        const refund = await this.mollieClient.refunds.get(body.id);
        return !!refund;
      } else if (body.id.startsWith('chb_')) {
        // Chargeback webhook
        const chargeback = await this.mollieClient.chargebacks.get(body.id);
        return !!chargeback;
      }
      
      this.logger.error(`Unknown webhook resource type: ${body.id}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to verify webhook resource: ${error.message}`);
      return false;
    }
  }

  parseWebhook(body: any): WebhookEvent {
    this.logger.log(`Parsing Mollie webhook: ${JSON.stringify(body)}`);
    
    // Mollie sends webhooks with just the resource ID
    // We need to determine the event type from the resource type
    let eventType = 'unknown';
    let resourceType = 'unknown';
    
    if (body.id) {
      if (body.id.startsWith('tr_')) {
        eventType = 'payment.updated';
        resourceType = 'payment';
      } else if (body.id.startsWith('sub_')) {
        eventType = 'subscription.updated';
        resourceType = 'subscription';
      } else if (body.id.startsWith('chb_')) {
        eventType = 'chargeback.updated';
        resourceType = 'chargeback';
      } else if (body.id.startsWith('re_')) {
        eventType = 'refund.updated';
        resourceType = 'refund';
      }
    }
    
    return {
      id: body.id || 'unknown',
      type: eventType,
      data: {
        ...body,
        resourceType,
      },
      createdAt: new Date(),
    };
  }
}