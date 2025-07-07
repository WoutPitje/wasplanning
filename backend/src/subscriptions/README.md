# Subscription Module Documentation

## Overview

The subscription module provides comprehensive subscription management for the car wash planning system. It handles subscription plans, usage tracking, billing cycles, limit enforcement, and integrates with the payment module for subscription payments.

## Architecture

### Module Structure

```
subscriptions/
├── dto/
│   ├── create-subscription.dto.ts      # DTO for creating subscriptions
│   ├── update-subscription.dto.ts      # DTO for updating subscriptions
│   └── change-plan.dto.ts              # DTO for plan changes
├── entities/
│   ├── subscription.entity.ts          # Main subscription entity
│   ├── subscription-plan.entity.ts     # Plan definitions
│   ├── usage-record.entity.ts          # Usage tracking
│   └── billing-cycle.entity.ts         # Billing period management
├── services/
│   ├── usage.service.ts                # Usage tracking and reporting
│   ├── limits.service.ts               # Limit enforcement
│   ├── billing.service.ts              # Billing cycle management
│   └── proration.service.ts            # Plan change calculations
├── subscriptions.controller.ts         # API endpoints
├── subscriptions.service.ts            # Core subscription logic
├── subscription-payment.service.ts     # Payment integration
└── subscriptions.module.ts             # Module definition
```

### Subscription Plans

The system offers three tiers:

#### 1. **Starter Plan**
- **Price**: €49/month or €490/year
- **Limits**:
  - 100 cars/month
  - 5 users
  - 1 location
- **Features**: Basic wash planning
- **Target**: Small garages

#### 2. **Groei (Growth) Plan**
- **Price**: €149/month or €1490/year
- **Limits**:
  - 500 cars/month
  - 20 users
  - 3 locations
- **Features**: All Starter features + priority support
- **Target**: Growing garages

#### 3. **Enterprise Plan**
- **Price**: Custom
- **Limits**: Unlimited
- **Features**: All features + custom integrations
- **Target**: Large garage chains

### Key Entities

#### 1. **Subscription Entity**
```typescript
- id: UUID
- tenantId: string (multi-tenant isolation)
- planId: UUID
- paymentMethodId: UUID (optional)
- status: SubscriptionStatus
  - TRIALING: Free trial period
  - ACTIVE: Paid and active
  - INCOMPLETE: Awaiting payment
  - PAST_DUE: Payment failed
  - CANCELED: Canceled by user
  - UNPAID: Multiple payment failures
- currentPeriodStart: Date
- currentPeriodEnd: Date
- trialEnd: Date (optional)
- canceledAt: Date (optional)
- cancelAtPeriodEnd: boolean
- billingInterval: MONTH | YEAR
- providerSubscriptionId: string (Mollie ID)
- metadata: JSONB
```

#### 2. **SubscriptionPlan Entity**
```typescript
- id: UUID
- name: PlanName (STARTER | GROEI | ENTERPRISE)
- displayName: string
- description: string
- priceMonthly: decimal
- priceYearly: decimal
- currency: string (EUR)
- limits: JSONB
  - maxCarsPerMonth: number
  - maxUsers: number
  - maxLocations: number
- features: string[]
- overageConfig: JSONB (for usage-based billing)
- isActive: boolean
- sortOrder: number
```

#### 3. **UsageRecord Entity**
```typescript
- id: UUID
- subscriptionId: UUID
- billingCycleId: UUID (optional)
- metric: UsageMetric
  - CARS_WASHED
  - ACTIVE_USERS
  - ACTIVE_LOCATIONS
- quantity: number
- recordedAt: Date
- metadata: JSONB
- aggregatedDate: Date (for daily aggregation)
```

#### 4. **BillingCycle Entity**
```typescript
- id: UUID
- subscriptionId: UUID
- startDate: Date
- endDate: Date
- status: BillingStatus
- baseAmount: decimal
- usageAmount: decimal
- totalAmount: decimal
- paidAt: Date (optional)
- paymentIntentId: string (optional)
- usageSummary: JSONB
```

### Core Services

#### 1. **SubscriptionsService**
Main service handling:
- Subscription creation (trial and paid)
- Plan changes with payment processing
- Subscription cancellation
- Status management
- Payment webhook integration

Key methods:
```typescript
// Create trial subscription
createSubscription(tenantId, dto): Promise<Subscription>

// Create paid subscription with checkout
createPaidSubscription(tenantId, dto): Promise<{checkoutUrl, subscription}>

// Change plan with payment
changeSubscriptionPlan(tenantId, subscriptionId, newPlan, returnUrl): Promise<{checkoutUrl, subscription}>

// Complete subscription after payment
completeNewSubscription(paymentId): Promise<Subscription>
completeSubscriptionChange(paymentId): Promise<Subscription>

// Get current subscription
getCurrentSubscription(tenantId): Promise<Subscription>

// Cancel subscription
cancelSubscription(tenantId, subscriptionId, immediately): Promise<Subscription>
```

#### 2. **UsageService**
Tracks resource usage:
- Records usage events (cars washed, active users/locations)
- Provides current period usage
- Daily usage aggregation
- Historical usage reporting

Key methods:
```typescript
// Record usage
recordUsage(subscriptionId, metric, quantity, metadata): Promise<UsageRecord>

// Get current period usage
getCurrentPeriodUsage(subscriptionId): Promise<UsageSummary>

// Get daily usage
getDailyUsage(subscriptionId, startDate, endDate): Promise<DailyUsage[]>
```

#### 3. **LimitsService**
Enforces subscription limits:
- Checks if actions are allowed
- Provides usage warnings (80%, 95% thresholds)
- Feature availability checks
- Returns detailed limit information

Key methods:
```typescript
// Check if action allowed
checkLimit(subscriptionId, metric, requestedQuantity): Promise<LimitCheckResult>

// Get current limits and usage
getCurrentLimitsAndUsage(subscriptionId): Promise<LimitsAndUsage>

// Check feature availability
hasFeature(subscriptionId, feature): Promise<boolean>
```

#### 4. **BillingService**
Manages billing cycles:
- Creates billing cycles
- Calculates charges (base + usage)
- Tracks payment status
- Provides billing history

Key methods:
```typescript
// Create billing cycle
createBillingCycle(subscriptionId): Promise<BillingCycle>

// Calculate current charges
calculateCurrentCharges(subscriptionId): Promise<ChargeCalculation>

// Get billing history
getBillingHistory(subscriptionId): Promise<BillingCycle[]>
```

### Subscription Flows

#### 1. **Trial Subscription Flow**
```
1. New tenant signs up
2. createSubscription() creates 30-day trial
3. Status: TRIALING
4. Full feature access during trial
5. Email reminders before trial ends
6. Convert to paid or downgrade after trial
```

#### 2. **Paid Subscription Flow**
```
1. User selects plan and billing interval
2. createPaidSubscription() creates checkout payment
3. Status: INCOMPLETE
4. User redirected to Mollie checkout
5. Payment processed
6. Webhook triggers completeNewSubscription()
7. Status: ACTIVE
8. Billing period starts
```

#### 3. **Plan Change Flow**
```
1. User selects new plan
2. changeSubscriptionPlan() creates payment
3. Full month/year charge (no proration currently)
4. User completes payment
5. Webhook triggers completeSubscriptionChange()
6. Plan updated, billing period reset
7. New limits apply immediately
```

#### 4. **Usage Tracking Flow**
```
1. Action performed (car wash, user login, etc.)
2. UsageService.recordUsage() called
3. Usage aggregated daily
4. LimitsService checks against plan limits
5. Warnings sent at 80% and 95% usage
6. Action blocked if limit exceeded
```

#### 5. **Billing Cycle Flow**
```
1. Cron job creates billing cycle at period end
2. Usage summarized for the period
3. Charges calculated (base + overages)
4. Payment processed via payment provider
5. Invoice generated and sent
6. Next billing cycle created
```

### API Endpoints

#### Public Endpoints
- `GET /subscriptions/plans` - List available plans

#### Authenticated Endpoints
- `GET /subscriptions/current` - Get tenant's subscription
- `POST /subscriptions` - Create trial subscription
- `POST /subscriptions/paid` - Create paid subscription
- `PATCH /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Cancel subscription
- `POST /subscriptions/:id/change-plan` - Change plan with payment
- `POST /subscriptions/:id/reactivate` - Reactivate canceled subscription

#### Usage Endpoints
- `GET /subscriptions/usage/current-period` - Current usage and limits
- `GET /subscriptions/usage/daily` - Daily usage data
- `GET /subscriptions/usage/history` - Historical usage

#### Billing Endpoints
- `GET /subscriptions/billing/current` - Current billing period
- `GET /subscriptions/billing/history` - Billing history
- `GET /subscriptions/billing/upcoming` - Upcoming charges estimate

### Frontend Integration

#### 1. **Composable: useSubscriptions**
Located at `frontend/composables/useSubscriptions.ts`

```typescript
const {
  // Data
  plans,              // Available subscription plans
  currentSubscription, // Current tenant subscription
  usage,              // Current period usage
  limits,             // Plan limits
  
  // Methods
  fetchPlans,         // Get available plans
  fetchSubscription,  // Get current subscription
  createSubscription, // Create trial subscription
  createPaidSubscription, // Create with payment
  updateSubscription, // Update subscription
  cancelSubscription, // Cancel subscription
  changePlan,         // Change plan with payment
  fetchUsage,         // Get usage data
  
  // Utilities
  formatPrice,        // Format currency
  getPlanFeatures,    // Get plan features
  canUpgrade,         // Check if upgrade available
} = useSubscriptions();
```

#### 2. **Example: Subscription Management Page**
```vue
<template>
  <div>
    <!-- Current Subscription -->
    <Card v-if="currentSubscription">
      <CardHeader>
        <CardTitle>{{ currentSubscription.plan.displayName }}</CardTitle>
        <Badge>{{ currentSubscription.status }}</Badge>
      </CardHeader>
      <CardContent>
        <div>{{ formatPrice(currentSubscription.plan.priceMonthly) }}/month</div>
        <div>Period ends: {{ formatDate(currentSubscription.currentPeriodEnd) }}</div>
      </CardContent>
    </Card>

    <!-- Available Plans -->
    <div class="grid grid-cols-3 gap-4">
      <Card v-for="plan in plans" :key="plan.id">
        <CardHeader>
          <CardTitle>{{ plan.displayName }}</CardTitle>
          <CardDescription>{{ plan.description }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ formatPrice(plan.priceMonthly) }}/mo
          </div>
          <ul>
            <li v-for="feature in plan.features">{{ feature }}</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button @click="selectPlan(plan)">
            Select Plan
          </Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup>
const { plans, currentSubscription, fetchPlans, createPaidSubscription } = useSubscriptions();

onMounted(() => {
  fetchPlans();
});

const selectPlan = async (plan) => {
  const result = await createPaidSubscription({
    planName: plan.name,
    billingInterval: 'MONTH',
    returnUrl: window.location.href
  });
  
  // Redirect to payment
  window.location.href = result.checkoutUrl;
};
</script>
```

#### 3. **Example: Usage Dashboard**
```vue
<template>
  <div>
    <h2>Current Usage</h2>
    
    <!-- Usage Metrics -->
    <div class="grid grid-cols-3 gap-4">
      <Card v-for="metric in usage?.metrics" :key="metric.name">
        <CardHeader>
          <CardTitle>{{ metric.displayName }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl">
            {{ metric.current }} / {{ metric.limit }}
          </div>
          <Progress :value="metric.percentage" />
          <Alert v-if="metric.percentage > 80" type="warning">
            {{ metric.percentage }}% of limit used
          </Alert>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
const { usage, fetchUsage } = useSubscriptions();

onMounted(() => {
  fetchUsage();
});
</script>
```

### Multi-Tenancy

All subscription data is isolated by tenant:
- Row-level security policies on all tables
- Tenant ID in JWT token
- Automatic tenant filtering in queries
- Separate usage tracking per tenant
- Isolated billing cycles

### Security Considerations

1. **Payment Security**
   - All payment processing through secure Mollie checkout
   - No credit card data stored locally
   - Payment method tokens only

2. **Access Control**
   - Only tenant admins can manage subscriptions
   - Read-only access for other roles
   - Super admin can view all subscriptions

3. **Webhook Security**
   - Payment webhooks validate transaction ownership
   - Metadata verification for context
   - Audit logging of all webhook events

### Testing

#### Unit Tests
- Service logic testing
- Usage calculation tests
- Limit enforcement tests
- Billing calculations

#### E2E Tests
- Full subscription flow
- Payment integration
- Plan change scenarios
- Usage tracking

Example test:
```typescript
describe('Subscription Payment Flow', () => {
  it('should create paid subscription after payment', async () => {
    // Create checkout
    const { checkoutUrl } = await createPaidSubscription({
      planName: 'STARTER',
      billingInterval: 'MONTH'
    });
    
    // Simulate payment webhook
    await processWebhook({
      paymentId: 'tr_test123',
      status: 'paid'
    });
    
    // Verify subscription activated
    const subscription = await getSubscription();
    expect(subscription.status).toBe('ACTIVE');
  });
});
```

### Monitoring & Analytics

1. **Usage Metrics**
   - Track usage patterns
   - Identify power users
   - Forecast capacity needs

2. **Subscription Metrics**
   - MRR/ARR tracking
   - Churn rate
   - Plan distribution
   - Trial conversion rate

3. **Billing Metrics**
   - Payment success rate
   - Failed payment reasons
   - Revenue by plan

### Future Enhancements

1. **Proration**
   - Implement proper proration for plan changes
   - Credit unused time
   - Charge for upgrades

2. **Recurring Billing**
   - Automatic monthly/yearly charges
   - Payment retry logic
   - Dunning management

3. **Usage-Based Billing**
   - Overage charges for excess usage
   - Tiered pricing models
   - Custom pricing rules

4. **Advanced Features**
   - Multiple subscriptions per tenant
   - Add-on products
   - Coupon/discount codes
   - Referral program

5. **Analytics Dashboard**
   - Revenue analytics
   - Usage trends
   - Subscription lifecycle
   - Cohort analysis

## Best Practices

1. **Always Check Limits**
   - Before any resource-consuming action
   - Provide clear feedback on limit status
   - Suggest upgrade when near limits

2. **Handle Payment Failures**
   - Clear error messages
   - Retry payment options
   - Grace period for past due

3. **Audit Everything**
   - Log all subscription changes
   - Track usage events
   - Record payment attempts

4. **Test Thoroughly**
   - Test all plan combinations
   - Verify limit enforcement
   - Test payment scenarios