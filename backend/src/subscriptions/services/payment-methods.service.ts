import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import {
  PaymentMethod,
  PaymentMethodType,
  CardBrand,
} from '../entities/payment-method.entity';
import { BillingService } from './billing.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private billingService: BillingService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });
  }

  /**
   * Create a SetupIntent for collecting payment method
   */
  async createSetupIntent(tenantId: string): Promise<{
    client_secret: string;
    payment_method_types: string[];
  }> {
    try {
      // Get or create Stripe customer
      const customer = await this.billingService.getOrCreateCustomer(tenantId);

      // Create SetupIntent
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card', 'sepa_debit'],
        usage: 'off_session',
        metadata: {
          tenant_id: tenantId,
        },
      });

      // Audit log
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'payment.setup_intent_created',
        resource_type: 'tenant',
        resource_id: tenantId,
        details: {
          setup_intent_id: setupIntent.id,
          customer_id: customer.id,
          payment_method_types: setupIntent.payment_method_types,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      return {
        client_secret: setupIntent.client_secret,
        payment_method_types: setupIntent.payment_method_types,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create setup intent for tenant ${tenantId}`,
        error,
      );
      throw new BadRequestException('Failed to create payment setup');
    }
  }

  /**
   * List all payment methods for a tenant
   */
  async listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
      order: {
        is_default: 'DESC',
        created_at: 'DESC',
      },
    });
  }

  /**
   * Attach a new payment method after successful SetupIntent
   */
  async attachPaymentMethod(
    tenantId: string,
    stripePaymentMethodId: string,
  ): Promise<PaymentMethod> {
    try {
      // Get Stripe payment method details
      const stripePaymentMethod = await this.stripe.paymentMethods.retrieve(
        stripePaymentMethodId,
      );

      // Verify it belongs to our customer
      const customer = await this.billingService.getOrCreateCustomer(tenantId);
      if (stripePaymentMethod.customer !== customer.id) {
        throw new BadRequestException(
          'Payment method does not belong to this tenant',
        );
      }

      // Check if already exists
      const existing = await this.paymentMethodRepository.findOne({
        where: { stripe_payment_method_id: stripePaymentMethodId },
      });
      if (existing) {
        return existing;
      }

      // Check if this should be the default (first payment method)
      const existingCount = await this.paymentMethodRepository.count({
        where: { tenant_id: tenantId, is_active: true },
      });
      const isDefault = existingCount === 0;

      // Create payment method record
      const paymentMethod = this.paymentMethodRepository.create({
        tenant_id: tenantId,
        stripe_payment_method_id: stripePaymentMethodId,
        type: stripePaymentMethod.type as PaymentMethodType,
        is_default: isDefault,
        billing_name: stripePaymentMethod.billing_details?.name,
        billing_email: stripePaymentMethod.billing_details?.email,
        billing_phone: stripePaymentMethod.billing_details?.phone,
        billing_address: stripePaymentMethod.billing_details?.address,
      });

      // Add type-specific fields
      if (stripePaymentMethod.type === 'card' && stripePaymentMethod.card) {
        paymentMethod.card_brand = stripePaymentMethod.card.brand as CardBrand;
        paymentMethod.card_last4 = stripePaymentMethod.card.last4;
        paymentMethod.card_exp_month = stripePaymentMethod.card.exp_month;
        paymentMethod.card_exp_year = stripePaymentMethod.card.exp_year;
        paymentMethod.card_fingerprint = stripePaymentMethod.card.fingerprint;
      } else if (
        stripePaymentMethod.type === 'sepa_debit' &&
        stripePaymentMethod.sepa_debit
      ) {
        paymentMethod.bank_name = stripePaymentMethod.sepa_debit.bank_code;
        paymentMethod.bank_last4 = stripePaymentMethod.sepa_debit.last4;
      }

      const savedMethod =
        await this.paymentMethodRepository.save(paymentMethod);

      // Audit log
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'payment.method_attached',
        resource_type: 'payment_method',
        resource_id: savedMethod.id,
        details: {
          stripe_payment_method_id: stripePaymentMethodId,
          type: savedMethod.type,
          is_default: savedMethod.is_default,
          last4: savedMethod.card_last4 || savedMethod.bank_last4,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      return savedMethod;
    } catch (error) {
      this.logger.error(
        `Failed to attach payment method ${stripePaymentMethodId}`,
        error,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to attach payment method');
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(
    tenantId: string,
    paymentMethodId: string,
  ): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: {
        id: paymentMethodId,
        tenant_id: tenantId,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.is_default) {
      throw new BadRequestException('Cannot remove default payment method');
    }

    try {
      // Detach from Stripe
      await this.stripe.paymentMethods.detach(
        paymentMethod.stripe_payment_method_id,
      );

      // Soft delete in our database
      await this.paymentMethodRepository.update(paymentMethodId, {
        is_active: false,
      });

      // Audit log
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'payment.method_removed',
        resource_type: 'payment_method',
        resource_id: paymentMethodId,
        details: {
          stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
          type: paymentMethod.type,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });
    } catch (error) {
      this.logger.error(
        `Failed to remove payment method ${paymentMethodId}`,
        error,
      );
      throw new BadRequestException('Failed to remove payment method');
    }
  }

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(
    tenantId: string,
    paymentMethodId: string,
  ): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: {
        id: paymentMethodId,
        tenant_id: tenantId,
        is_active: true,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    if (paymentMethod.is_default) {
      return paymentMethod; // Already default
    }

    // Remove default from all other methods
    await this.paymentMethodRepository.update(
      {
        tenant_id: tenantId,
        is_default: true,
      },
      {
        is_default: false,
      },
    );

    // Set this one as default
    await this.paymentMethodRepository.update(paymentMethodId, {
      is_default: true,
    });

    // Update Stripe customer default
    try {
      const customer = await this.billingService.getOrCreateCustomer(tenantId);
      await this.stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.stripe_payment_method_id,
        },
      });
    } catch (error) {
      this.logger.warn('Failed to update Stripe default payment method', error);
    }

    // Audit log
    await this.auditService.logAction({
      tenant_id: tenantId,
      user_id: null,
      action: 'payment.method_set_default',
      resource_type: 'payment_method',
      resource_id: paymentMethodId,
      details: {
        stripe_payment_method_id: paymentMethod.stripe_payment_method_id,
        type: paymentMethod.type,
      },
      ip_address: '127.0.0.1',
      user_agent: 'System',
    });

    paymentMethod.is_default = true;
    return paymentMethod;
  }

  /**
   * Get default payment method for a tenant
   */
  async getDefaultPaymentMethod(
    tenantId: string,
  ): Promise<PaymentMethod | null> {
    return this.paymentMethodRepository.findOne({
      where: {
        tenant_id: tenantId,
        is_default: true,
        is_active: true,
      },
    });
  }
}
