import { Subscription, SubscriptionStatus } from './subscription.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

describe('Subscription Entity', () => {
  let subscription: Subscription;
  let plan: SubscriptionPlan;

  beforeEach(() => {
    plan = new SubscriptionPlan();
    plan.id = 'plan-1';
    plan.name = 'free';
    plan.display_name = 'Free';
    plan.price_cents = 0;
    plan.max_cars_per_month = 100;
    plan.max_active_users = 2;
    plan.max_locations = 1;

    subscription = new Subscription();
    subscription.id = 'sub-1';
    subscription.tenant_id = 'tenant-1';
    subscription.plan = plan;
    subscription.plan_id = plan.id;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.current_period_start = new Date('2025-01-01');
    subscription.current_period_end = new Date('2025-02-01');
    subscription.stripe_subscription_id = null;
    subscription.stripe_subscription_item_id = null;
    subscription.stripe_customer_id = null;
    subscription.cancel_at_period_end = false;
    subscription.canceled_at = null;
    subscription.cancel_at = null;
  });

  it('should create a subscription with default values', () => {
    expect(subscription).toBeDefined();
    expect(subscription.tenant_id).toBe('tenant-1');
    expect(subscription.plan_id).toBe('plan-1');
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('should have valid subscription linked to FREE plan', () => {
    expect(subscription.plan).toBeDefined();
    expect(subscription.plan.name).toBe('free');
    expect(subscription.plan.price_cents).toBe(0);
  });

  it('should have valid period dates', () => {
    expect(subscription.current_period_start).toBeInstanceOf(Date);
    expect(subscription.current_period_end).toBeInstanceOf(Date);
    expect(
      subscription.current_period_end > subscription.current_period_start,
    ).toBe(true);
  });

  it('should handle subscription status transitions', () => {
    // Test status transitions
    subscription.status = SubscriptionStatus.INCOMPLETE;
    expect(subscription.status).toBe(SubscriptionStatus.INCOMPLETE);

    subscription.status = SubscriptionStatus.ACTIVE;
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE);

    subscription.status = SubscriptionStatus.PAST_DUE;
    expect(subscription.status).toBe(SubscriptionStatus.PAST_DUE);

    subscription.status = SubscriptionStatus.CANCELED;
    expect(subscription.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('should handle Stripe subscription details', () => {
    subscription.stripe_subscription_id = 'sub_123456';
    subscription.stripe_subscription_item_id = 'si_123456';

    expect(subscription.stripe_subscription_id).toBe('sub_123456');
    expect(subscription.stripe_subscription_item_id).toBe('si_123456');
  });

  it('should handle payment failure tracking', () => {
    subscription.payment_failed_at = new Date('2025-01-15');
    subscription.payment_failure_count = 2;
    subscription.grace_period_end = new Date('2025-01-20');

    expect(subscription.payment_failed_at).toBeInstanceOf(Date);
    expect(subscription.payment_failure_count).toBe(2);
    expect(subscription.grace_period_end).toBeInstanceOf(Date);
  });
});
