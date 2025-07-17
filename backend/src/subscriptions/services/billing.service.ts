import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Tenant } from '../../auth/entities/tenant.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { AuditService } from '../../audit/audit.service';
import { InvoicesResponseDto, InvoiceDto } from '../dto/invoice-response.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe;
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private auditService: AuditService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured');
    }

    this.stripe = new Stripe(secretKey || '', {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });

    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Create a Stripe customer for a tenant
   */
  async createStripeCustomer(tenantId: string): Promise<Stripe.Customer> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    // Check if customer already exists
    const existingCustomer = await this.getExistingCustomer(tenantId);
    if (existingCustomer) {
      this.logger.log(`Stripe customer already exists for tenant ${tenantId}`);
      return existingCustomer;
    }

    try {
      const customer = await this.retryStripeCall(() =>
        this.stripe.customers.create({
          name: tenant.display_name || tenant.name,
          email: this.getTenantEmail(tenant),
          metadata: {
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            environment: this.configService.get('NODE_ENV') || 'development',
            created_via: 'wasplanning_backend',
          },
        }),
      );

      // Store customer ID in subscription record
      await this.subscriptionRepository.update(
        { tenant_id: tenantId },
        { stripe_customer_id: customer.id },
      );

      // Audit log
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'stripe.customer.created',
        resource_type: 'tenant',
        resource_id: tenantId,
        details: {
          customer_name: customer.name,
          customer_email: customer.email,
          stripe_customer_id: customer.id,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      this.logger.log(
        `Created Stripe customer ${customer.id} for tenant ${tenantId}`,
      );
      return customer;
    } catch (error) {
      this.logger.error(
        `Failed to create Stripe customer for tenant ${tenantId}`,
        error,
      );

      // Audit log error
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'stripe.customer.creation_failed',
        resource_type: 'stripe_customer',
        resource_id: null,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          tenant_name: tenant.name,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      throw error;
    }
  }

  /**
   * Get or create a Stripe customer for a tenant
   */
  async getOrCreateCustomer(tenantId: string): Promise<Stripe.Customer> {
    // First check our database
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (subscription?.stripe_customer_id) {
      try {
        const customer = await this.retryStripeCall(() =>
          this.stripe.customers.retrieve(subscription.stripe_customer_id),
        );

        if (!customer.deleted) {
          return customer as Stripe.Customer;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to retrieve Stripe customer ${subscription.stripe_customer_id}`,
          error,
        );
      }
    }

    // Customer doesn't exist or was deleted, create a new one
    return this.createStripeCustomer(tenantId);
  }

  /**
   * Check if a Stripe customer already exists for a tenant
   */
  private async getExistingCustomer(
    tenantId: string,
  ): Promise<Stripe.Customer | null> {
    try {
      // Search by metadata
      const customers = await this.retryStripeCall(() =>
        this.stripe.customers.search({
          query: `metadata['tenant_id']:'${tenantId}'`,
          limit: 1,
        }),
      );

      if (customers.data.length > 0) {
        const customer = customers.data[0];

        // Update our database with the customer ID
        await this.subscriptionRepository.update(
          { tenant_id: tenantId },
          { stripe_customer_id: customer.id },
        );

        return customer;
      }
    } catch (error) {
      this.logger.warn(`Failed to search for existing customer`, error);
    }

    return null;
  }

  /**
   * Get tenant admin email for Stripe customer
   */
  private getTenantEmail(tenant: Tenant): string {
    // In a real implementation, you might want to get the admin user's email
    // For now, we'll construct one from the tenant name
    return `admin@${tenant.name}.wasplanning.nl`;
  }

  /**
   * Retry Stripe API calls with exponential backoff
   */
  private async retryStripeCall<T>(
    operation: () => Promise<T>,
    attempt = 1,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable
      const isStripeError =
        error && typeof error === 'object' && 'type' in error;
      if (isStripeError) {
        const retryableErrors = [
          'rate_limit_error',
          'api_connection_error',
          'api_error',
        ];

        if (!retryableErrors.includes(error.type)) {
          throw error;
        }
      } else {
        throw error;
      }

      // Wait before retrying
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      this.logger.warn(
        `Stripe API call failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryStripeCall(operation, attempt + 1);
    }
  }

  /**
   * Validate Stripe configuration
   */
  async validateConfiguration(): Promise<boolean> {
    try {
      const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
      if (!secretKey) {
        this.logger.error('Stripe secret key not configured');
        return false;
      }

      // Test the API key by retrieving account info
      await this.stripe.accounts.retrieve();
      this.logger.log('Stripe configuration validated successfully');
      return true;
    } catch (error) {
      this.logger.error('Stripe configuration validation failed', error);
      return false;
    }
  }

  /**
   * Create or update a Stripe subscription
   */
  async createSubscription(
    tenantId: string,
    planId: string,
    paymentMethodId?: string,
    immediate: boolean = true,
  ): Promise<{
    subscription: Subscription;
    stripeSubscription: Stripe.Subscription;
    clientSecret?: string;
    requiresAction: boolean;
    amountCharged: number;
    prorationAmount?: number;
  }> {
    // Get current subscription
    let currentSubscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
      relations: ['plan'],
    });

    // If no subscription exists, create a FREE subscription
    if (!currentSubscription) {
      const freePlan = await this.subscriptionPlanRepository.findOne({
        where: { name: 'free' },
      });

      if (!freePlan) {
        throw new BadRequestException(
          'Free plan not found in database. Please run seed data.',
        );
      }

      currentSubscription = await this.subscriptionRepository.save({
        tenant_id: tenantId,
        plan: freePlan,
        status: SubscriptionStatus.ACTIVE,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });

      // Reload with plan relation
      currentSubscription = await this.subscriptionRepository.findOne({
        where: { id: currentSubscription.id },
        relations: ['plan'],
      });

      if (!currentSubscription) {
        throw new Error('Failed to create subscription');
      }
    }

    // Get new plan
    const newPlan = await this.subscriptionPlanRepository.findOne({
      where: { id: planId },
    });

    if (!newPlan) {
      throw new BadRequestException('Invalid plan ID');
    }

    // Early validation: Check for valid payment method if upgrading to a paid plan
    if (
      newPlan.price_cents > 0 &&
      (!currentSubscription.plan || currentSubscription.plan.price_cents === 0)
    ) {
      // This is a free-to-paid upgrade, check for payment method
      const hasValidPaymentMethod = await this.hasValidPaymentMethod(
        tenantId,
        paymentMethodId,
      );

      if (!hasValidPaymentMethod) {
        throw new BadRequestException(
          'Cannot upgrade to a paid plan without a valid payment method. Please add a payment method first.',
        );
      }
    }

    // Handle downgrades
    if (
      currentSubscription.plan?.price_cents > 0 &&
      newPlan.price_cents === 0
    ) {
      // Downgrade to free plan
      if (immediate) {
        throw new BadRequestException(
          'Cannot downgrade to free plan immediately. Please retry with "immediate": false to schedule the downgrade for the end of your billing period.',
        );
      }
      // For scheduled downgrades, we'll cancel the subscription at period end
      // and create a new free subscription when the webhook fires
    }

    // Get or create Stripe customer
    const customer = await this.getOrCreateCustomer(tenantId);

    // Get payment method for paid plans
    let stripePaymentMethodId: string | undefined;

    if (newPlan.price_cents > 0) {
      stripePaymentMethodId = await this.resolvePaymentMethod(
        tenantId,
        paymentMethodId,
        currentSubscription.plan?.price_cents === 0, // Is free-to-paid upgrade?
      );
    }

    try {
      let stripeSubscription: Stripe.Subscription | undefined;
      let amountCharged = 0;
      let prorationAmount: number | undefined;

      // Special handling for downgrade to free plan
      if (
        currentSubscription.plan?.price_cents > 0 &&
        newPlan.price_cents === 0 &&
        currentSubscription.stripe_subscription_id
      ) {
        // Cancel the subscription at period end
        stripeSubscription = await this.cancelSubscriptionAtPeriodEnd(
          currentSubscription.stripe_subscription_id,
        );

        // Update our database to reflect the scheduled cancellation
        currentSubscription.cancel_at_period_end = true;
        currentSubscription.canceled_at = new Date();

        // Use the current_period_end from Stripe if available, otherwise use our database value
        const stripeSubData = stripeSubscription as any;
        if (stripeSubData && stripeSubData.current_period_end) {
          currentSubscription.cancel_at = new Date(
            stripeSubData.current_period_end * 1000,
          );
        } else {
          // Fallback to the current period end we have in the database
          currentSubscription.cancel_at =
            currentSubscription.current_period_end;
        }

        // The actual plan change will happen via webhook when the subscription ends
        const savedSubscription =
          await this.subscriptionRepository.save(currentSubscription);

        return {
          subscription: savedSubscription,
          stripeSubscription,
          requiresAction: false,
          amountCharged: 0,
          prorationAmount: 0,
        };
      }

      // Handle existing incomplete subscriptions
      if (currentSubscription.stripe_subscription_id) {
        const shouldCreateNew =
          await this.shouldCreateNewSubscription(currentSubscription);
        if (shouldCreateNew) {
          currentSubscription.stripe_subscription_id = null;
          currentSubscription.stripe_subscription_item_id = null;
        }
      }

      if (currentSubscription.stripe_subscription_id) {
        try {
          // Update existing subscription
          const updateParams: Stripe.SubscriptionUpdateParams = {
            items: [
              {
                id: currentSubscription.stripe_subscription_item_id,
                price: newPlan.stripe_price_id,
              },
            ],
            proration_behavior: immediate ? 'always_invoice' : 'none',
            billing_cycle_anchor: immediate ? 'now' : 'unchanged',
            expand: ['latest_invoice.payment_intent'],
          };

          if (stripePaymentMethodId) {
            updateParams.default_payment_method = stripePaymentMethodId;
          }

          stripeSubscription = await this.retryStripeCall(() =>
            this.stripe.subscriptions.update(
              currentSubscription.stripe_subscription_id,
              updateParams,
            ),
          );

          // Stripe handles proration automatically, but we can extract it from the invoice
          if (
            immediate &&
            stripeSubscription.latest_invoice &&
            typeof stripeSubscription.latest_invoice !== 'string'
          ) {
            const invoice = stripeSubscription.latest_invoice;
            // Find proration line items by checking the description or metadata
            if (invoice.lines && invoice.lines.data) {
              const prorationItems = invoice.lines.data.filter(
                (line) =>
                  line.description?.includes('Unused time') ||
                  line.description?.includes('Remaining time'),
              );
              prorationAmount = prorationItems.reduce(
                (sum, item) => sum + (item.amount || 0),
                0,
              );
            }
          }
        } catch (error: any) {
          // Handle various error cases where we need to create a new subscription
          const needsNewSubscription =
            error.code === 'resource_missing' ||
            error.code === 'subscription_invalid' ||
            (error.message &&
              (error.message.includes('incomplete_expired') ||
                error.message.includes('canceled') ||
                error.message.includes('unpaid')));

          if (needsNewSubscription) {
            this.logger.warn(
              `Cannot update Stripe subscription ${currentSubscription.stripe_subscription_id}: ${error.message}. Creating new subscription.`,
            );
            currentSubscription.stripe_subscription_id = null;
            currentSubscription.stripe_subscription_item_id = null;
          } else {
            throw error;
          }
        }
      }

      if (!currentSubscription.stripe_subscription_id || !stripeSubscription) {
        // Create new subscription
        const createParams: Stripe.SubscriptionCreateParams = {
          customer: customer.id,
          items: [{ price: newPlan.stripe_price_id }],
          payment_settings: {
            save_default_payment_method: 'on_subscription',
            payment_method_types: ['card', 'sepa_debit'], // Note: iDEAL doesn't support recurring payments
          },
          expand: ['latest_invoice.payment_intent'],
        };

        if (stripePaymentMethodId) {
          // We have a payment method, attempt payment immediately
          createParams.default_payment_method = stripePaymentMethodId;
          createParams.payment_behavior = 'allow_incomplete'; // Allow incomplete if payment fails (e.g., 3D Secure)
          createParams.payment_settings.payment_method_options = {
            card: {
              request_three_d_secure: 'automatic',
            },
          };
        } else if (newPlan.price_cents > 0) {
          // For free-to-paid upgrades without payment method, create incomplete subscription
          createParams.payment_behavior = 'default_incomplete';
          createParams.payment_settings.payment_method_options = {
            card: {
              request_three_d_secure: 'automatic',
            },
          };
        } else {
          // Free plan, no payment needed
          createParams.payment_behavior = 'allow_incomplete';
        }

        this.logger.log(
          `Creating new subscription for tenant ${tenantId}. ` +
            `Payment method: ${stripePaymentMethodId ? 'provided' : 'none'}, ` +
            `Payment behavior: ${createParams.payment_behavior}`,
        );

        stripeSubscription = await this.retryStripeCall(() =>
          this.stripe.subscriptions.create(createParams),
        );

        amountCharged = newPlan.price_cents;
      }

      // Check if 3D Secure is required
      let clientSecret: string | undefined;
      let requiresAction = false;

      if (!stripeSubscription) {
        throw new Error('Failed to create or update subscription');
      }

      if (
        stripeSubscription.latest_invoice &&
        typeof stripeSubscription.latest_invoice !== 'string'
      ) {
        const invoice = stripeSubscription.latest_invoice;

        const paymentIntentId = (invoice as any).payment_intent;
        if (paymentIntentId && typeof paymentIntentId !== 'string') {
          const paymentIntent = paymentIntentId as Stripe.PaymentIntent;

          if (
            paymentIntent.status === 'requires_action' ||
            paymentIntent.status === 'requires_payment_method'
          ) {
            requiresAction = true;
            clientSecret = paymentIntent.client_secret || undefined;
          }

          if (paymentIntent.amount) {
            amountCharged = paymentIntent.amount;
          }
        }
      }

      // Update our database
      currentSubscription.plan_id = planId;
      currentSubscription.plan = newPlan; // Update the relation object as well
      currentSubscription.stripe_subscription_id = stripeSubscription.id;
      currentSubscription.stripe_subscription_item_id =
        stripeSubscription.items.data[0].id;
      currentSubscription.stripe_customer_id = customer.id;
      currentSubscription.status = this.mapStripeStatus(
        stripeSubscription.status,
      );
      // Stripe stores timestamps as seconds, we need milliseconds for Date
      const currentPeriodStart = (stripeSubscription as any)
        .current_period_start;
      const currentPeriodEnd = (stripeSubscription as any).current_period_end;

      if (currentPeriodStart && currentPeriodEnd) {
        currentSubscription.current_period_start = new Date(
          currentPeriodStart * 1000,
        );
        currentSubscription.current_period_end = new Date(
          currentPeriodEnd * 1000,
        );
      } else {
        // Fallback to current date and 30 days from now
        currentSubscription.current_period_start = new Date();
        currentSubscription.current_period_end = new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        );
      }

      if (stripeSubscription.cancel_at) {
        currentSubscription.cancel_at = new Date(
          stripeSubscription.cancel_at * 1000,
        );
      }

      this.logger.log(
        `Saving subscription update for tenant ${tenantId}. ` +
          `Old plan: ${currentSubscription.plan?.name || 'unknown'}, ` +
          `New plan ID: ${planId}, ` +
          `New plan name: ${newPlan.name}`,
      );

      const savedSubscription =
        await this.subscriptionRepository.save(currentSubscription);

      this.logger.log(
        `Subscription upgraded successfully. ` +
          `ID: ${savedSubscription.id}, ` +
          `Status: ${savedSubscription.status}, ` +
          `Plan: ${savedSubscription.plan?.name || savedSubscription.plan_id}, ` +
          `Requires Action: ${requiresAction}`,
      );

      // Audit log
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'subscription.upgraded',
        resource_type: 'subscription',
        resource_id: savedSubscription.id,
        details: {
          old_plan_id: currentSubscription.plan?.id,
          old_plan_name: currentSubscription.plan?.name,
          new_plan_id: newPlan.id,
          new_plan_name: newPlan.name,
          amount_charged: amountCharged,
          proration_amount: prorationAmount,
          stripe_subscription_id: stripeSubscription.id,
          payment_status: stripeSubscription.latest_invoice
            ? (stripeSubscription.latest_invoice as any).status
            : 'unknown',
          requires_action: requiresAction,
          immediate,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      return {
        subscription: savedSubscription,
        stripeSubscription,
        clientSecret,
        requiresAction,
        amountCharged,
        prorationAmount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to create/update subscription for tenant ${tenantId}`,
        error,
      );

      // Audit log error
      await this.auditService.logAction({
        tenant_id: tenantId,
        user_id: null,
        action: 'subscription.upgrade_failed',
        resource_type: 'subscription',
        resource_id: currentSubscription.id,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          plan_id: planId,
          payment_method_id: paymentMethodId,
        },
        ip_address: '127.0.0.1',
        user_agent: 'System',
      });

      if (error instanceof Stripe.errors.StripeError) {
        if (error.code === 'card_declined') {
          throw new BadRequestException(
            'Payment was declined. Please check your payment method.',
          );
        } else if (error.code === 'insufficient_funds') {
          throw new BadRequestException(
            'Insufficient funds. Please use a different payment method.',
          );
        }
      }

      throw new BadRequestException('Failed to process subscription upgrade');
    }
  }

  /**
   * Map Stripe subscription status to our status
   */
  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status,
  ): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      unpaid: SubscriptionStatus.UNPAID,
      canceled: SubscriptionStatus.CANCELED,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.ACTIVE,
      paused: SubscriptionStatus.ACTIVE,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
  }

  /**
   * Cancel a subscription at the end of the billing period
   */
  async cancelSubscriptionAtPeriodEnd(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.retryStripeCall(() =>
        this.stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        }),
      );

      this.logger.log(
        `Subscription ${stripeSubscriptionId} set to cancel at period end`,
      );
      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to cancel subscription ${stripeSubscriptionId}`,
        error,
      );
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Reactivate a subscription that was scheduled for cancellation
   */
  async reactivateSubscription(
    stripeSubscriptionId: string,
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.retryStripeCall(() =>
        this.stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: false,
        }),
      );

      this.logger.log(`Subscription ${stripeSubscriptionId} reactivated`);
      return subscription;
    } catch (error) {
      this.logger.error(
        `Failed to reactivate subscription ${stripeSubscriptionId}`,
        error,
      );
      throw new BadRequestException('Failed to reactivate subscription');
    }
  }

  /**
   * Check if we should create a new subscription instead of updating
   */
  private async shouldCreateNewSubscription(
    currentSubscription: Subscription,
  ): Promise<boolean> {
    if (!currentSubscription.stripe_subscription_id) {
      return false;
    }

    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        currentSubscription.stripe_subscription_id,
      );

      // If subscription is incomplete or incomplete_expired, we need a new one
      if (
        stripeSubscription.status === 'incomplete' ||
        stripeSubscription.status === 'incomplete_expired'
      ) {
        // Try to cancel if possible
        if (stripeSubscription.status === 'incomplete') {
          try {
            await this.stripe.subscriptions.cancel(
              currentSubscription.stripe_subscription_id,
            );
          } catch (cancelError: any) {
            this.logger.warn(
              `Could not cancel incomplete subscription: ${cancelError.message}`,
            );
          }
        }
        return true;
      }

      return false;
    } catch (error: any) {
      // If subscription not found in Stripe, we need a new one
      if (error.code === 'resource_missing') {
        this.logger.warn(
          `Stripe subscription ${currentSubscription.stripe_subscription_id} not found.`,
        );
        return true;
      }
      throw error;
    }
  }

  /**
   * Resolve payment method for subscription
   */
  private async resolvePaymentMethod(
    tenantId: string,
    requestedPaymentMethodId?: string,
    isFreeToPaidUpgrade: boolean = false,
  ): Promise<string | undefined> {
    this.logger.log(
      `Resolving payment method for tenant ${tenantId}. ` +
        `Requested: ${requestedPaymentMethodId || 'none'}, ` +
        `Is free-to-paid: ${isFreeToPaidUpgrade}`,
    );
    // If specific payment method requested, validate and use it
    if (requestedPaymentMethodId) {
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: {
          id: requestedPaymentMethodId,
          tenant_id: tenantId,
          is_active: true,
        },
      });

      if (!paymentMethod) {
        throw new BadRequestException('Invalid payment method');
      }

      return paymentMethod.stripe_payment_method_id;
    }

    // Try to use default payment method
    const defaultMethod = await this.paymentMethodRepository.findOne({
      where: {
        tenant_id: tenantId,
        is_default: true,
        is_active: true,
      },
    });

    if (defaultMethod) {
      return defaultMethod.stripe_payment_method_id;
    }

    // No default method - try any available method
    const anyMethod = await this.paymentMethodRepository.findOne({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
      order: {
        created_at: 'DESC', // Use most recent
      },
    });

    if (anyMethod) {
      // Set it as default since there's no default
      await this.paymentMethodRepository.update(anyMethod.id, {
        is_default: true,
      });

      this.logger.log(
        `No default payment method found for tenant ${tenantId}, ` +
          `using and setting as default: ${anyMethod.id}`,
      );

      return anyMethod.stripe_payment_method_id;
    }

    // No payment methods available
    if (isFreeToPaidUpgrade) {
      // Allow incomplete subscription for free-to-paid upgrades
      this.logger.log(
        `No payment method for free-to-paid upgrade for tenant ${tenantId}. ` +
          `Creating incomplete subscription.`,
      );
      return undefined;
    }

    // Paid-to-paid change requires payment method
    throw new BadRequestException(
      'No payment method on file. Please add a payment method first.',
    );
  }

  /**
   * Get invoices for a customer
   */
  async getInvoices(
    stripeCustomerId: string,
    limit?: number,
    starting_after?: string,
  ): Promise<InvoicesResponseDto> {
    try {
      // Validate and set limits
      const invoiceLimit = Math.min(limit || 10, 100); // Default 10, max 100

      const params: Stripe.InvoiceListParams = {
        customer: stripeCustomerId,
        limit: invoiceLimit,
        expand: ['data.subscription'],
      };

      if (starting_after) {
        params.starting_after = starting_after;
      }

      const invoices = await this.retryStripeCall(() =>
        this.stripe.invoices.list(params),
      );

      // Transform Stripe invoices to our DTO format
      const transformedInvoices: InvoiceDto[] = invoices.data.map(
        (invoice) => ({
          id: invoice.id,
          number: invoice.number || undefined,
          date: new Date(invoice.created * 1000), // Convert from Unix timestamp
          amount: invoice.amount_paid, // Amount in cents
          status: invoice.status || 'unknown',
          pdf_url: invoice.invoice_pdf || undefined,
        }),
      );

      return {
        invoices: transformedInvoices,
        has_more: invoices.has_more,
        total_count: invoices.data.length, // Note: This is count in current page, not total
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch invoices for customer ${stripeCustomerId}`,
        error,
      );

      // Return empty list instead of throwing error
      return {
        invoices: [],
        has_more: false,
        total_count: 0,
      };
    }
  }

  /**
   * Check if tenant has a valid payment method
   */
  private async hasValidPaymentMethod(
    tenantId: string,
    requestedPaymentMethodId?: string,
  ): Promise<boolean> {
    // If specific payment method requested, check if it's valid
    if (requestedPaymentMethodId) {
      const paymentMethod = await this.paymentMethodRepository.findOne({
        where: {
          id: requestedPaymentMethodId,
          tenant_id: tenantId,
          is_active: true,
        },
      });

      return !!paymentMethod;
    }

    // Check for any active payment method
    const activeMethodCount = await this.paymentMethodRepository.count({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });

    return activeMethodCount > 0;
  }
}
