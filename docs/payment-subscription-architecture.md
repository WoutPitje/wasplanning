# Payment & Subscription Architecture

## Overview

This document outlines the architecture for the payment and subscription system in the Wasplanning platform. The system is designed to support multiple payment providers, subscription-based billing, usage-based billing, and hybrid models.

## Design Principles

1. **Provider Agnostic**: Easy to switch between payment providers (Mollie, Stripe, etc.)
2. **Flexible Billing**: Support for subscriptions, usage-based, and hybrid billing models
3. **Multi-Tenant**: Complete isolation between tenants for billing and payments
4. **Scalable**: Handle high-volume usage tracking and billing calculations
5. **Audit-Ready**: Complete transaction and usage history for compliance

## Module Structure

### 1. Payment Module (`/backend/src/payments/`)

The payment module handles all payment processing, provider integration, and transaction management.

```
payments/
├── payments.module.ts              # Module definition
├── payments.controller.ts          # REST endpoints
├── payments.service.ts             # Core payment logic
├── interfaces/
│   ├── payment-provider.interface.ts   # Provider contract
│   ├── payment-method.interface.ts     # Payment method types
│   └── payment-result.interface.ts     # Transaction results
├── providers/
│   ├── provider.factory.ts         # Provider selection logic
│   ├── mollie/
│   │   ├── mollie.provider.ts     # Mollie implementation
│   │   ├── mollie.config.ts       # Mollie configuration
│   │   └── mollie.types.ts        # Mollie-specific types
│   └── stripe/                     # Future provider
├── entities/
│   ├── payment-method.entity.ts    # Stored payment methods
│   └── payment-transaction.entity.ts # Transaction history
├── dto/
│   ├── create-payment-method.dto.ts
│   ├── process-payment.dto.ts
│   └── webhook.dto.ts
└── webhooks/
    └── webhook.controller.ts       # Provider webhooks
```

#### Key Interfaces

```typescript
// payment-provider.interface.ts
export interface PaymentProvider {
  // Subscription management
  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  updateSubscription(id: string, params: UpdateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(id: string): Promise<void>;
  
  // Payment methods
  createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  
  // One-time payments
  createPayment(params: CreatePaymentParams): Promise<Payment>;
  
  // Webhooks
  validateWebhook(payload: any, signature: string): boolean;
  processWebhook(event: WebhookEvent): Promise<void>;
}
```

### 2. Subscription Module (`/backend/src/subscriptions/`)

The subscription module handles business logic for subscriptions, usage tracking, and billing cycles.

```
subscriptions/
├── subscriptions.module.ts         # Module definition
├── subscriptions.controller.ts     # REST endpoints
├── subscriptions.service.ts        # Core subscription logic
├── entities/
│   ├── subscription.entity.ts      # Active subscriptions
│   ├── subscription-plan.entity.ts # Available plans
│   ├── usage-record.entity.ts      # Usage tracking
│   └── billing-cycle.entity.ts     # Billing periods
├── dto/
│   ├── create-subscription.dto.ts
│   ├── update-subscription.dto.ts
│   ├── record-usage.dto.ts
│   └── subscription-query.dto.ts
├── services/
│   ├── billing.service.ts          # Billing calculations
│   ├── usage.service.ts            # Usage tracking
│   ├── proration.service.ts        # Plan changes
│   └── limits.service.ts           # Feature limits
├── guards/
│   └── subscription.guard.ts       # Access control
└── jobs/
    └── billing-cycle.job.ts        # Scheduled billing
```

## Database Schema

### Payment Module Tables

#### payment_methods
```sql
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  provider VARCHAR(50) NOT NULL,
  provider_method_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'card', 'sepa_debit', 'ideal', etc.
  is_default BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### payment_transactions
```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  provider VARCHAR(50) NOT NULL,
  provider_transaction_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'subscription'
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed'
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Subscription Module Tables

#### subscription_plans
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  billing_type VARCHAR(50) NOT NULL, -- 'subscription', 'usage_based', 'hybrid'
  
  -- Limits (NULL = unlimited)
  max_locations INTEGER,
  max_cars_per_month INTEGER,
  max_users INTEGER,
  
  -- Features
  features JSONB DEFAULT '{}',
  
  -- Overage pricing (for hybrid model)
  overage_price_per_car DECIMAL(10,2),
  overage_price_per_location DECIMAL(10,2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  payment_method_id UUID REFERENCES payment_methods(id),
  
  status VARCHAR(50) NOT NULL, -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  
  -- Billing cycle
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'month', -- 'month', 'year'
  
  -- Provider reference
  provider VARCHAR(50),
  provider_subscription_id VARCHAR(255),
  
  -- Trial
  trial_end TIMESTAMP,
  
  -- Cancellation
  canceled_at TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### usage_records
```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  billing_cycle_id UUID REFERENCES billing_cycles(id),
  
  metric_type VARCHAR(50) NOT NULL, -- 'cars_washed', 'active_users', 'active_locations'
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,4), -- For usage-based pricing
  
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_usage_subscription_metric (subscription_id, metric_type, recorded_at)
);
```

#### billing_cycles
```sql
CREATE TABLE billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  
  -- Charges
  base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  usage_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Usage summary
  usage_summary JSONB DEFAULT '{}',
  
  -- Billing status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
  invoice_id VARCHAR(255),
  paid_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_billing_cycle_dates (subscription_id, start_date, end_date)
);
```

## API Endpoints

### Payment Module Endpoints

```
POST   /api/v1/payments/methods
GET    /api/v1/payments/methods
DELETE /api/v1/payments/methods/:id
POST   /api/v1/payments/methods/:id/set-default

POST   /api/v1/payments/charge
GET    /api/v1/payments/transactions
GET    /api/v1/payments/transactions/:id

POST   /api/v1/payments/webhook/mollie
POST   /api/v1/payments/webhook/stripe  (future)
```

### Subscription Module Endpoints

```
# Plans
GET    /api/v1/subscriptions/plans
GET    /api/v1/subscriptions/plans/:id

# Subscriptions
POST   /api/v1/subscriptions
GET    /api/v1/subscriptions/current
PATCH  /api/v1/subscriptions/:id
DELETE /api/v1/subscriptions/:id
POST   /api/v1/subscriptions/:id/reactivate

# Usage
POST   /api/v1/subscriptions/usage
GET    /api/v1/subscriptions/usage/current-period
GET    /api/v1/subscriptions/usage/history

# Billing
GET    /api/v1/subscriptions/billing/cycles
GET    /api/v1/subscriptions/billing/upcoming
GET    /api/v1/subscriptions/billing/invoices
```

## Billing Models

### 1. Pure Subscription Model
Fixed monthly fee with set limits:
- Starter: €49/month - 1 location, 500 cars, 5 users
- Groei: €149/month - 3 locations, 2000 cars, unlimited users
- Enterprise: €299/month - unlimited everything

### 2. Usage-Based Model (Future)
Pay only for what you use:
- €0.15 per car washed
- €25 per active location per month
- €5 per active user per month

### 3. Hybrid Model
Base subscription + overage charges:
- Base: €149/month includes 2000 cars
- Overage: €0.10 per additional car
- Extra locations: €39/location/month

## Usage Tracking

### Metrics Tracked
1. **Cars Washed**: Count from wash_tasks table
2. **Active Users**: Users who logged in during billing period
3. **Active Locations**: Locations with at least one wash task

### Implementation
```typescript
// Record car wash
await usageService.recordUsage({
  subscriptionId: tenant.subscriptionId,
  metricType: 'cars_washed',
  quantity: 1,
  metadata: { washTaskId, locationId }
});

// Check limits
const canWash = await limitsService.checkLimit(
  tenant.subscriptionId,
  'cars_washed'
);
```

## Feature Flags & Limits

### Guard Implementation
```typescript
@UseGuards(SubscriptionGuard)
@RequireFeature('advanced_reporting')
@Controller('reports')
export class ReportsController {
  // Only accessible with proper subscription
}
```

### Limit Checking
```typescript
// In wash-tasks.service.ts
async createWashTask(data: CreateWashTaskDto) {
  const subscription = await this.subscriptionService.getCurrentSubscription();
  
  if (!await this.limitsService.canCreateWashTask(subscription)) {
    throw new SubscriptionLimitExceededException('Monthly car limit reached');
  }
  
  // Create wash task and record usage
}
```

## Webhook Processing

### Mollie Webhook Events
- `payment.paid`: Payment successful
- `payment.failed`: Payment failed
- `subscription.created`: New subscription
- `subscription.updated`: Subscription changed
- `subscription.canceled`: Subscription canceled

### Processing Flow
1. Validate webhook signature
2. Parse event type and data
3. Update local database
4. Trigger business logic (activate features, send emails, etc.)

## Migration & Deployment

### Phase 1: Infrastructure
1. Create payment and subscription tables
2. Add payment provider configuration
3. Implement core payment module with Mollie

### Phase 2: Subscription Logic
1. Create subscription plans
2. Implement usage tracking
3. Add feature flags and guards

### Phase 3: Integration
1. Add subscription checks to existing modules
2. Create billing dashboard
3. Implement usage meters

### Phase 4: Testing & Launch
1. Test payment flows
2. Test subscription lifecycle
3. Test usage tracking and limits
4. Launch with existing customers

## Security Considerations

1. **PCI Compliance**: Never store card details, use tokenization
2. **Webhook Security**: Validate all webhook signatures
3. **Tenant Isolation**: Ensure all queries include tenant_id
4. **Rate Limiting**: Limit payment attempts per tenant
5. **Audit Trail**: Log all payment and subscription changes

## Monitoring & Alerts

1. **Failed Payments**: Alert on payment failures
2. **Usage Spikes**: Alert on unusual usage patterns
3. **Limit Approaching**: Notify customers at 80% of limits
4. **Subscription Changes**: Log all plan changes
5. **Revenue Metrics**: Track MRR, churn, LTV

## Future Enhancements

1. **Multiple Payment Methods**: Support multiple cards per tenant
2. **Invoice Customization**: Custom invoice templates
3. **Dunning Management**: Automated retry for failed payments
4. **Usage Forecasting**: Predict when limits will be hit
5. **Custom Pricing**: Per-tenant custom pricing plans
6. **Marketplace**: Add-on features and integrations