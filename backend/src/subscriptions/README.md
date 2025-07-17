# Subscriptions Module

## Overview

This module handles all subscription-related functionality for the Wasplanning system, including plan management, usage tracking, billing via Stripe, and enforcement of tier limits.

## Environment Variables

### Backend (.env)
```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### Frontend (.env)
```
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

Note: The frontend needs the same publishable key as configured in the backend.

## Subscription Tiers

### 1. **Free Tier** (€0/month)
- **Cars**: 50/month max
- **Users**: 2 active users max
- **Locations**: 1 location max
- **Features**: Basic wash planning
- **No Stripe subscription** - Tracked internally only

### 2. **Standard** (€100/month)
- **Cars**: 1,500/month max
- **Users**: 10 active users max
- **Locations**: 3 locations max
- **Features**: All features + reporting
- **Stripe Price ID**: `price_standard_monthly_eur`

### 3. **Enterprise** (€400/month)
- **Cars**: Unlimited
- **Users**: Unlimited
- **Locations**: Unlimited
- **Features**: Everything + API access
- **Stripe Price ID**: `price_enterprise_monthly_eur`

## Architecture

### Database Schema

```sql
-- subscription_plans table (seeded, not tenant-specific)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL, -- 'free', 'standard', 'enterprise'
  display_name VARCHAR NOT NULL,
  price_cents INTEGER NOT NULL, -- 0, 10000, 40000
  stripe_price_id VARCHAR, -- NULL for free tier
  max_cars_per_month INTEGER, -- NULL = unlimited
  max_active_users INTEGER,
  max_locations INTEGER,
  features JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- subscriptions table (tenant subscriptions)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR UNIQUE,
  stripe_customer_id VARCHAR,
  status VARCHAR NOT NULL, -- 'active', 'canceled', 'past_due', 'unpaid'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(tenant_id) -- One subscription per tenant
);

-- usage_records table (track monthly usage)
CREATE TABLE usage_records (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  record_type VARCHAR NOT NULL, -- 'cars_washed', 'active_users'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(tenant_id, record_type, period_start)
);
```

### Service Architecture

```typescript
// Core services
SubscriptionService     // Main subscription logic
BillingService         // Stripe integration
UsageService          // Track and enforce limits
LimitsService        // Check limits before operations
ProrationService     // Calculate upgrade/downgrade amounts
```

## Implementation Flow

### 1. **Tenant Creation**
```typescript
// When new tenant is created:
1. Automatically assign FREE plan
2. Create subscription record (no Stripe)
3. Initialize usage records for current month
4. Set up usage tracking
```

### 2. **Usage Tracking**
```typescript
// Real-time tracking of:
- Cars washed (increment on wash task completion)
- Active users (track on login)
- Locations (count on location CRUD)

// Usage is tracked in usage_records table
// Reset monthly based on tenant creation date
```

### 3. **Limit Enforcement**
```typescript
// Before operations, check limits:
async canWashCar(tenantId: string): Promise<boolean> {
  const usage = await this.getMonthlyUsage(tenantId, 'cars_washed');
  const limit = await this.getPlanLimit(tenantId, 'max_cars_per_month');
  return !limit || usage < limit;
}

// Soft limits (warnings):
- At 80% usage: Email notification
- At 90% usage: In-app warning banner
- At 100% usage: Block operation with upgrade prompt
```

### 4. **Plan Upgrades/Downgrades**

#### Upgrade Flow:
```typescript
1. User selects new plan in UI
2. Calculate proration for current month
3. Create/update Stripe subscription
4. Update subscription record
5. Immediately apply new limits
6. Send confirmation email
```

#### Downgrade Flow:
```typescript
1. User selects lower plan
2. Check if current usage fits new plan
3. If not, show what needs reduction
4. Schedule downgrade for next billing cycle
5. Set cancel_at_period_end flag
6. Send confirmation email
```

### 5. **Billing Integration (Stripe)**

#### Webhook Handlers:
```typescript
// Critical webhooks to handle:
- customer.subscription.created
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
- customer.subscription.trial_will_end // Not used but handle gracefully
```

#### Payment Flow:
```typescript
1. Free tier: No Stripe interaction
2. Paid tiers: 
   - Create Stripe customer on first upgrade
   - Attach payment method
   - Create subscription
   - Handle 3D Secure (iDEAL, cards)
   - Automatic retry on failure
```

### 6. **Sync Mechanisms**

#### Data Consistency:
```typescript
// Always sync:
1. Stripe subscription status → Our database
2. Usage counts → Enforcement rules
3. Plan changes → User permissions
4. Payment status → Account access

// Sync strategies:
- Webhooks for Stripe events (primary)
- Daily reconciliation job (backup)
- On-demand sync button (admin emergency)
```

## API Endpoints

```typescript
// Subscription management
GET    /api/v1/subscriptions/current          // Current subscription + usage
GET    /api/v1/subscriptions/plans            // Available plans
POST   /api/v1/subscriptions/upgrade          // Upgrade subscription
POST   /api/v1/subscriptions/downgrade        // Downgrade subscription
POST   /api/v1/subscriptions/cancel           // Cancel subscription
GET    /api/v1/subscriptions/usage            // Detailed usage stats
GET    /api/v1/subscriptions/invoices         // Billing history

// Stripe integration
POST   /api/v1/subscriptions/create-checkout   // Start payment flow
POST   /api/v1/subscriptions/update-payment   // Change payment method
GET    /api/v1/subscriptions/payment-methods  // List payment methods
POST   /webhooks/stripe                       // Stripe webhook endpoint
```

## Error Handling

### Payment Failures:
```typescript
1. First failure: Send email notification
2. Retry after 3 days
3. Second failure: Show warning in app
4. Retry after 5 days
5. Third failure: Restrict to read-only
6. After 30 days: Downgrade to free tier
```

### Limit Exceeded:
```typescript
// Graceful degradation:
- Cars: Block new wash requests, show upgrade
- Users: Prevent new user creation
- Locations: Disable multi-location features
```

## Security Considerations

1. **Webhook Security**
   - Verify Stripe webhook signatures
   - Use webhook secrets from environment
   - Log all webhook events

2. **Payment Security**
   - Never store card details
   - Use Stripe's PCI-compliant flow
   - Implement 3D Secure for EU cards

3. **Access Control**
   - Only GARAGE_ADMIN can manage subscriptions
   - Enforce feature flags based on plan
   - Audit log all subscription changes

## Monitoring & Alerts

### Key Metrics:
- Monthly Recurring Revenue (MRR)
- Churn rate
- Usage vs. limits per tenant
- Failed payment rate
- Upgrade/downgrade rate

### Alerts:
- Payment failures
- Unusual usage spikes
- Subscription sync failures
- Webhook processing errors

## Testing Strategy

### Unit Tests:
- Limit calculation logic
- Proration calculations
- Usage tracking accuracy
- Plan upgrade/downgrade rules

### Integration Tests:
- Stripe API interactions
- Webhook processing
- End-to-end payment flow
- Usage limit enforcement

### E2E Tests:
- Complete upgrade flow
- Downgrade with validation
- Payment failure handling
- Usage limit blocking


## Future Enhancements

1. **Usage-Based Pricing**
   - Pay per car above limit
   - Add-on packages

2. **Annual Plans**
   - 10% discount for yearly payment
   - Better cash flow

3. **Partner/Reseller Program**
   - Bulk licenses
   - White-label options

4. **Advanced Analytics**
   - Revenue forecasting
   - Churn prediction
   - Usage patterns