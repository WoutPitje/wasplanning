import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { AuditService } from '../../audit/audit.service';
import { EmailService } from '../../email/email.service';
import { User, UserRole } from '../../auth/entities/user.entity';

@Injectable()
export class WebhookHandlerService {
  private readonly logger = new Logger(WebhookHandlerService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private auditService: AuditService,
    private emailService: EmailService,
  ) {}

  /**
   * Route webhook event to appropriate handler
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Handling webhook event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        // We don't use trials, but handle gracefully
        this.logger.log(
          'Trial ending webhook received but not processed (trials not used)',
        );
        break;

      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object);
        break;

      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  /**
   * Handle subscription created event
   */
  private async handleSubscriptionCreated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for Stripe ID: ${stripeSubscription.id}`,
      );
      return;
    }

    // Update subscription status
    await this.subscriptionRepository.update(subscription.id, {
      status: this.mapStripeStatus(stripeSubscription.status),
      current_period_start: new Date(
        (stripeSubscription as any).current_period_start * 1000,
      ),
      current_period_end: new Date(
        (stripeSubscription as any).current_period_end * 1000,
      ),
    });

    // Audit log
    await this.auditService.logAction({
      tenant_id: subscription.tenant_id,
      user_id: null,
      action: 'webhook.subscription_created',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: {
        stripe_subscription_id: stripeSubscription.id,
        status: stripeSubscription.status,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle subscription updated event
   */
  private async handleSubscriptionUpdated(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscription.id },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for Stripe ID: ${stripeSubscription.id}`,
      );
      return;
    }

    // Update subscription
    const updates: Partial<Subscription> = {
      status: this.mapStripeStatus(stripeSubscription.status),
      current_period_start: new Date(
        (stripeSubscription as any).current_period_start * 1000,
      ),
      current_period_end: new Date(
        (stripeSubscription as any).current_period_end * 1000,
      ),
      cancel_at_period_end: (stripeSubscription as any).cancel_at_period_end,
    };

    if ((stripeSubscription as any).canceled_at) {
      updates.canceled_at = new Date(
        (stripeSubscription as any).canceled_at * 1000,
      );
    }

    if ((stripeSubscription as any).cancel_at) {
      updates.cancel_at = new Date(
        (stripeSubscription as any).cancel_at * 1000,
      );
    }

    await this.subscriptionRepository.update(subscription.id, updates);

    // Audit log
    await this.auditService.logAction({
      tenant_id: subscription.tenant_id,
      user_id: null,
      action: 'webhook.subscription_updated',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: {
        stripe_subscription_id: stripeSubscription.id,
        status: stripeSubscription.status,
        updates,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle subscription deleted event
   */
  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: stripeSubscription.id },
      relations: ['tenant', 'plan'],
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription not found for Stripe ID: ${stripeSubscription.id}`,
      );
      return;
    }

    // Update subscription status to canceled
    await this.subscriptionRepository.update(subscription.id, {
      status: SubscriptionStatus.CANCELED,
      canceled_at: new Date(),
    });

    // If this was a scheduled downgrade to free plan, create a new free subscription
    if (subscription.cancel_at_period_end) {
      // Get the free plan
      const freePlan = await this.subscriptionRepository.manager
        .getRepository(SubscriptionPlan)
        .findOne({ where: { name: 'free' } });

      if (freePlan) {
        // Create a new free subscription
        await this.subscriptionRepository.save({
          tenant_id: subscription.tenant_id,
          plan_id: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });

        this.logger.log(
          `Created free subscription for tenant ${subscription.tenant_id} after scheduled downgrade`,
        );
      }
    }

    // Send cancellation notification email
    const adminUsers = await this.userRepository.find({
      where: {
        tenant_id: subscription.tenant_id,
        role: UserRole.GARAGE_ADMIN,
      },
    });

    for (const admin of adminUsers) {
      try {
        await this.emailService.sendSubscriptionCanceledEmail(admin.email, {
          firstName: admin.first_name,
          tenantName: subscription.tenant.name,
          planName: subscription.plan.display_name,
          endDate: new Date(
            (stripeSubscription as any).current_period_end * 1000,
          ),
        });
      } catch (error) {
        this.logger.error(
          `Failed to send cancellation email to ${admin.email}`,
          error,
        );
      }
    }

    // Audit log
    await this.auditService.logAction({
      tenant_id: subscription.tenant_id,
      user_id: null,
      action: 'webhook.subscription_deleted',
      resource_type: 'subscription',
      resource_id: subscription.id,
      details: {
        stripe_subscription_id: stripeSubscription.id,
        plan_name: subscription.plan.name,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle invoice payment succeeded event
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if (!(invoice as any).subscription) {
      return;
    }

    const subscriptionId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription.id;

    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: subscriptionId },
      relations: ['tenant'],
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }

    const wasFailedBefore =
      subscription.status === SubscriptionStatus.PAST_DUE ||
      subscription.payment_failure_count > 0;

    // Update subscription status to active and clear failure state
    await this.subscriptionRepository.update(subscription.id, {
      status: SubscriptionStatus.ACTIVE,
      payment_failure_count: 0,
      payment_failed_at: null,
      grace_period_end: null,
    });

    // Send recovery email if payment was previously failed
    if (wasFailedBefore) {
      const adminUsers = await this.userRepository.find({
        where: {
          tenant_id: subscription.tenant_id,
          role: UserRole.GARAGE_ADMIN,
        },
      });

      for (const admin of adminUsers) {
        try {
          await this.emailService.sendPaymentSucceededAfterFailureEmail(
            admin.email,
            {
              firstName: admin.first_name,
              tenantName: subscription.tenant.name,
              amount: (invoice as any).amount_paid / 100, // Convert from cents
              currency: ((invoice as any).currency || 'EUR').toUpperCase(),
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to send payment recovery email to ${admin.email}`,
            error,
          );
        }
      }
    }

    // Audit log
    await this.auditService.logAction({
      tenant_id: subscription.tenant_id,
      user_id: null,
      action: 'webhook.payment_succeeded',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        stripe_subscription_id: subscriptionId,
        amount_paid: (invoice as any).amount_paid,
        currency: (invoice as any).currency,
        was_recovery: wasFailedBefore,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle invoice payment failed event
   */
  private async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    if (!(invoice as any).subscription) {
      return;
    }

    const subscriptionId =
      typeof (invoice as any).subscription === 'string'
        ? (invoice as any).subscription
        : (invoice as any).subscription.id;

    const subscription = await this.subscriptionRepository.findOne({
      where: { stripe_subscription_id: subscriptionId },
      relations: ['tenant'],
    });

    if (!subscription) {
      this.logger.warn(`Subscription not found for invoice: ${invoice.id}`);
      return;
    }

    // Calculate grace period (30 days from first failure)
    const now = new Date();
    const isFirstFailure = !subscription.payment_failed_at;
    const gracePeriodEnd = isFirstFailure
      ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : subscription.grace_period_end;

    // Update subscription status and failure tracking
    await this.subscriptionRepository.update(subscription.id, {
      status: SubscriptionStatus.PAST_DUE,
      payment_failure_count: subscription.payment_failure_count + 1,
      payment_failed_at: isFirstFailure ? now : subscription.payment_failed_at,
      grace_period_end: gracePeriodEnd,
    });

    // Calculate next retry date based on Stripe's retry schedule
    const attemptCount = (invoice as any).attempt_count || 1;
    let nextRetryDate: Date | undefined;

    // Stripe's default retry schedule
    if (attemptCount === 1) {
      nextRetryDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
    } else if (attemptCount === 2) {
      nextRetryDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days
    } else if (attemptCount === 3) {
      nextRetryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    // Send payment failure notification email
    const adminUsers = await this.userRepository.find({
      where: {
        tenant_id: subscription.tenant_id,
        role: UserRole.GARAGE_ADMIN,
      },
    });

    for (const admin of adminUsers) {
      try {
        await this.emailService.sendPaymentFailedEmail(admin.email, {
          firstName: admin.first_name,
          tenantName: subscription.tenant.name,
          amount: (invoice as any).amount_due / 100, // Convert from cents
          currency: ((invoice as any).currency || 'EUR').toUpperCase(),
          attemptCount: attemptCount,
          nextRetryDate: nextRetryDate,
        });

        // Send grace period warning if approaching end
        if (gracePeriodEnd) {
          const daysRemaining = Math.ceil(
            (gracePeriodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
          );
          if (daysRemaining <= 7) {
            await this.emailService.sendGracePeriodWarningEmail(admin.email, {
              firstName: admin.first_name,
              tenantName: subscription.tenant.name,
              gracePeriodEnd: gracePeriodEnd,
              daysRemaining: daysRemaining,
            });
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to send payment failure email to ${admin.email}`,
          error,
        );
      }
    }

    // Audit log
    await this.auditService.logAction({
      tenant_id: subscription.tenant_id,
      user_id: null,
      action: 'webhook.payment_failed',
      resource_type: 'invoice',
      resource_id: invoice.id,
      details: {
        stripe_subscription_id: subscriptionId,
        amount_due: (invoice as any).amount_due,
        currency: (invoice as any).currency,
        attempt_count: attemptCount,
        payment_failure_count: subscription.payment_failure_count + 1,
        grace_period_end: gracePeriodEnd,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle payment intent succeeded event
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);

    // Audit log
    await this.auditService.logAction({
      tenant_id: null, // Could extract from metadata
      user_id: null,
      action: 'webhook.payment_intent_succeeded',
      resource_type: 'payment_intent',
      resource_id: paymentIntent.id,
      details: {
        amount: (paymentIntent as any).amount,
        currency: (paymentIntent as any).currency,
        payment_method_types: (paymentIntent as any).payment_method_types,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
  }

  /**
   * Handle payment intent failed event
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    this.logger.warn(`Payment intent failed: ${paymentIntent.id}`);

    // Audit log
    await this.auditService.logAction({
      tenant_id: null, // Could extract from metadata
      user_id: null,
      action: 'webhook.payment_intent_failed',
      resource_type: 'payment_intent',
      resource_id: paymentIntent.id,
      details: {
        amount: (paymentIntent as any).amount,
        currency: (paymentIntent as any).currency,
        last_payment_error: (paymentIntent as any).last_payment_error,
      },
      ip_address: '127.0.0.1',
      user_agent: 'Stripe Webhook',
    });
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
      incomplete: SubscriptionStatus.INCOMPLETE, // Fixed: was incorrectly mapped to ACTIVE
      incomplete_expired: SubscriptionStatus.CANCELED,
      trialing: SubscriptionStatus.ACTIVE,
      paused: SubscriptionStatus.ACTIVE,
    };

    return statusMap[stripeStatus] || SubscriptionStatus.ACTIVE;
  }
}
