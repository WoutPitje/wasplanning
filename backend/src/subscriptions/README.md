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
│   └── usage-record.entity.ts          # Usage tracking
├── services/
│   ├── usage.service.ts                # Usage tracking and reporting
│   ├── limits.service.ts               # Limit enforcement
│   └── proration.service.ts            # Plan change calculations
├── subscriptions.controller.ts         # API endpoints
├── subscriptions.service.ts            # Core subscription logic
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
- nextPaymentDate: Date
- trialEnd: Date (optional)
- canceledAt: Date (optional)
- cancelAtPeriodEnd: boolean
- billingInterval: MONTH | YEAR
- creditBalance: decimal (for plan change credits)
- mollieCustomerId: string (Mollie customer ID)
- mollieSubscriptionId: string (Mollie subscription ID)
- metadata: JSONB
```

#### 2. **SubscriptionPlan Entity**
```typescript
- id: UUID
- name: PlanName (STARTER | GROEI | ENTERPRISE)
- displayName: string
- priceMonthly: decimal
- priceYearly: decimal
- billingType: BillingType (SUBSCRIPTION | USAGE_BASED | HYBRID)
- maxCarsPerMonth: number (nullable for unlimited)
- maxUsers: number (nullable for unlimited)
- maxLocations: number (nullable for unlimited)
- features: Record<string, boolean>
- overagePricePerCar: decimal (for hybrid billing)
- overagePricePerLocation: decimal (for hybrid billing)
- isActive: boolean
```

#### 3. **UsageRecord Entity**
```typescript
- id: UUID
- subscriptionId: UUID
- metric: UsageMetric
  - cars_washed
  - active_users
  - active_locations
- quantity: number
- period: Date
- metadata: JSONB
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

#### 4. **ProrationService**
Handles plan change calculations:
- Calculates credits for downgrades
- Determines charges for upgrades
- Uses full-period charging (no daily proration)

Key methods:
```typescript
// Calculate plan change costs
calculatePlanChange(subscription, newPlan, billingInterval): Promise<ProrationResult>
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

#### 2. **Paid Subscription Flow with Mollie**
```
1. User selects plan and billing interval
2. createPaidSubscription() creates checkout payment
3. Status: INCOMPLETE
4. User redirected to Mollie checkout
5. First payment establishes mandate
6. Webhook triggers completeNewSubscription()
7. Mollie subscription created automatically
8. Status: ACTIVE
9. Recurring billing handled by Mollie
```

#### 3. **Plan Change Flow**
```
1. User selects new plan
2. changeSubscriptionPlan() calculates costs
3. ProrationService determines:
   - Full charge for upgrades
   - Credit added for downgrades
4. If payment needed, redirect to Mollie
5. Webhook triggers completeSubscriptionChange()
6. Old Mollie subscription canceled
7. New Mollie subscription created
8. Plan updated, new limits apply
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

#### 5. **Mollie Recurring Billing Flow**
```
1. Mollie automatically charges subscription
2. Webhook received for payment status
3. If paid: Transaction recorded
4. If failed: Status updated to PAST_DUE
5. Multiple failures: Status to UNPAID
6. Email notifications sent
```

### API Endpoints

#### Public Endpoints
- `GET /subscriptions/plans` - List available plans

#### Authenticated Endpoints
- `GET /subscriptions/current` - Get tenant's subscription
- `POST /subscriptions` - Create trial subscription
- `POST /subscriptions/paid` - Create paid subscription with Mollie checkout
- `PATCH /subscriptions/:id` - Update subscription
- `DELETE /subscriptions/:id` - Cancel subscription
- `POST /subscriptions/:id/change-plan` - Change plan with payment
- `POST /subscriptions/:id/reactivate` - Reactivate canceled subscription
- `POST /subscriptions/complete-new/:paymentId` - Complete new subscription after payment
- `POST /subscriptions/complete-change/:paymentId` - Complete plan change after payment
- `POST /subscriptions/:id/preview-plan-change` - Preview plan change costs
- `POST /subscriptions/:id/pay-overdue` - Pay overdue subscription

#### Usage Endpoints
- `GET /subscriptions/usage/current-period` - Current usage and limits
- `GET /subscriptions/usage/daily` - Daily usage data
- `GET /subscriptions/usage/history` - Historical usage

#### Billing Endpoints
- `GET /subscriptions/billing/upcoming` - Upcoming charges estimate with usage
- `GET /subscriptions/credit-balance` - Credit balance and history
- `GET /subscriptions/pending-payment` - Check for pending payments

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
   - Mollie webhooks verified by fetching resource
   - Payment ownership validated via metadata
   - Audit logging of all webhook events
   - Idempotent webhook processing

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

### Current Implementation Status

✅ **Completed**
- Mollie integration for subscription payments
- Trial subscriptions with 30-day period
- Paid subscriptions with monthly/yearly billing
- Plan changes with full-period charging
- Credit system for downgrades
- Usage tracking and limit enforcement
- Webhook processing for payment events
- Multi-tenant isolation
- Frontend integration

⚠️ **Partial Implementation**
- Proration (uses full-period charging instead)
- Usage-based billing (structure in place, not active)
- Email notifications (manual process)

❌ **Not Implemented**
- Automated trial expiration handling
- Payment failure escalation
- Scheduled billing tasks
- Usage overage charges
- Analytics dashboard

### Future Enhancements

1. **Enhanced Proration**
   - Daily proration for plan changes
   - Immediate vs end-of-period changes
   - Partial refunds for downgrades

2. **Advanced Billing**
   - Usage-based overage charges
   - Tiered pricing models
   - Custom pricing rules
   - Multiple payment methods

3. **Automation**
   - Scheduled trial expiration
   - Automated payment retries
   - Dunning email sequences
   - Usage alerts and notifications

4. **Analytics & Reporting**
   - MRR/ARR dashboard
   - Churn analytics
   - Usage trends
   - Revenue forecasting

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