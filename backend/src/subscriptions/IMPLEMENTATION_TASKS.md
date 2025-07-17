# Subscription System Implementation Tasks

## Overview
This document breaks down the subscription system implementation into small, manageable tasks. Each task includes requirements for tests, audit logging, error handling, and all other project standards.

---

## Task 1: Create Subscription Plan Entity and Migration

### Goal
Create the foundation for subscription plans in the database.

### Implementation
1. Create `subscription-plan.entity.ts` with fields:
   - id, name, display_name, price_cents
   - stripe_price_id, max_cars_per_month, max_active_users, max_locations
   - features (JSONB), created_at, updated_at
2. Create migration `CreateSubscriptionPlans`
3. Seed the 3 plans in migration:
   - Free: €0, 50 cars, 2 users, 1 location
   - Standard: €100, 1500 cars, 10 users, 3 locations  
   - Enterprise: €400, unlimited

### Requirements
- [ ] Entity follows TypeORM patterns from existing entities
- [ ] Migration uses proper naming convention
- [ ] Seed data matches pricing documentation
- [ ] No foreign keys yet - just the plans table

### Tests
- [ ] Migration runs successfully
- [ ] Plans are queryable after migration
- [ ] Verify seed data is correct

### Audit Logging
- Not needed - this is system configuration

---

## Task 2: Add Subscription Relationship to Tenant

### Goal
Link tenants to subscription plans with a default FREE plan.

### Implementation
1. Create `subscription.entity.ts` with:
   - tenant_id (unique), plan_id, status
   - stripe_subscription_id, stripe_customer_id
   - current_period_start/end, cancel_at_period_end
2. Create migration `AddSubscriptionsToTenants`
3. In migration: Create subscription record for each existing tenant with FREE plan
4. Update Tenant entity to include subscription relation

### Requirements
- [ ] One subscription per tenant (unique constraint)
- [ ] All existing tenants get FREE plan
- [ ] Period dates set to tenant creation date + 1 month
- [ ] Status defaults to 'active'

### Tests
- [ ] Unit test: Tenant-Subscription relationship works
- [ ] Integration test: Migration assigns free plans correctly
- [ ] E2E test: New tenant creation includes subscription

### Audit Logging
- [ ] Log when subscription is created: `subscription.created`
- [ ] Include plan name and tenant in details

---

## Task 3: Create Usage Tracking System

### Goal
Track monthly usage of cars washed and active users.

### Implementation
1. Create `usage-record.entity.ts` with:
   - tenant_id, record_type, period_start/end, count
   - Unique constraint on (tenant_id, record_type, period_start)
2. Create `usage.service.ts` with methods:
   - `incrementCarCount(tenantId)`
   - `trackActiveUser(tenantId, userId)`
   - `getMonthlyUsage(tenantId, type)`
   - `initializeMonthlyRecords(tenantId)`
3. Create migration `CreateUsageRecords`
4. Initialize current month records for all tenants

### Requirements
- [ ] Atomic increment operations (no race conditions)
- [ ] Track unique users per month (set, not counter)
- [ ] Auto-create new month records as needed
- [ ] Handle timezone correctly (tenant timezone)

### Tests
- [ ] Unit test: Increment operations are atomic
- [ ] Unit test: Active users tracked uniquely
- [ ] Integration test: Monthly rollover works
- [ ] Test concurrent increments don't lose data

### Audit Logging
- Not needed - this is automated tracking

---

## Task 4: Create Limits Service

### Goal
Check if operations are allowed based on plan limits.

### Implementation
1. Create `limits.service.ts` with methods:
   - `canWashCar(tenantId): Promise<boolean>`
   - `canCreateUser(tenantId): Promise<boolean>`
   - `canCreateLocation(tenantId): Promise<boolean>`
   - `getUsagePercentage(tenantId, type): Promise<number>`
   - `isApproachingLimit(tenantId, type): Promise<boolean>` (80% threshold)
2. Create interface `subscription-limits.interface.ts`
3. Add subscription guard `subscription.guard.ts`

### Requirements
- [ ] Return false if limit exceeded
- [ ] Return true if limit is null (unlimited)
- [ ] Cache subscription plan for performance
- [ ] Warning threshold at 80%

### Tests
- [ ] Unit test: Correctly checks against limits
- [ ] Unit test: Handles unlimited (null) correctly
- [ ] Unit test: Percentage calculations
- [ ] Integration test: Guard blocks requests

### Error Handling
- [ ] Return specific error codes for different limits
- [ ] Include current usage and limit in error response
- [ ] Suggest upgrade path in error message

---

## Task 5: Integrate Limit Checking

### Goal
Actually enforce limits in existing operations.

### Implementation
1. Update `users.service.ts`:
   - Check `canCreateUser` before creating
   - Throw `SubscriptionLimitExceeded` error
2. Update wash task creation (when implemented):
   - Check `canWashCar` before accepting
3. Update location creation (when implemented):
   - Check `canCreateLocation`
4. Add limit info to relevant DTOs

### Requirements
- [ ] Check limits BEFORE database operations
- [ ] Transaction rollback if limit check fails after partial operation
- [ ] Show remaining quota in UI responses
- [ ] Email notification at 80% usage

### Tests
- [ ] E2E test: Cannot create user when at limit
- [ ] E2E test: Can create user when under limit
- [ ] Test transaction rollback on limit exceeded
- [ ] Test email sent at 80%

### Audit Logging
- [ ] Log limit exceeded attempts: `limit.exceeded`
- [ ] Include type, current usage, and limit

### Error Handling
- [ ] HTTP 403 with `SUBSCRIPTION_LIMIT_EXCEEDED` code
- [ ] Include upgrade URL in error response
- [ ] User-friendly error messages in Dutch

---

## Task 6: Create Subscription Read API

### Goal
Expose subscription information via API.

### Implementation
1. Create `subscriptions.controller.ts` with endpoints:
   - `GET /current` - Current subscription with usage
   - `GET /plans` - Available plans with features
   - `GET /usage` - Detailed usage breakdown
   - `GET /limits` - Current limits and remaining quota
2. Create DTOs:
   - `SubscriptionResponseDto`
   - `PlanResponseDto`
   - `UsageResponseDto`
3. Add to `subscriptions.module.ts`

### Requirements
- [ ] Include current usage in all responses
- [ ] Calculate days remaining in period
- [ ] Show feature flags based on plan
- [ ] Prices in cents and euros

### Tests
- [ ] Unit test: DTOs transform data correctly
- [ ] Integration test: Endpoints return correct data
- [ ] E2E test: API accessible with auth
- [ ] Test responses match Swagger docs

### API Documentation
- [ ] Swagger decorators on all endpoints
- [ ] Example responses in documentation
- [ ] Clear descriptions of each field

---

## Task 7: Stripe Customer Creation

### Goal
Create Stripe customers when tenants upgrade from free plan.

### Implementation
1. Install `@stripe/stripe-js` package
2. Create `stripe.config.ts` with configuration
3. Create `billing.service.ts` with:
   - `createStripeCustomer(tenant)`
   - `getOrCreateCustomer(tenantId)`
4. Update subscription entity with `stripe_customer_id`
5. Add Stripe keys to environment config

### Requirements
- [ ] Only create customer on first paid subscription
- [ ] Store customer ID in our database
- [ ] Include tenant metadata in Stripe
- [ ] Handle Stripe API errors gracefully

### Tests
- [ ] Unit test: Mock Stripe API calls
- [ ] Integration test: Customer creation flow
- [ ] Test error handling for API failures
- [ ] Test idempotency (no duplicate customers)

### Audit Logging
- [ ] Log customer creation: `stripe.customer.created`
- [ ] Log any Stripe API errors

### Error Handling
- [ ] Retry failed API calls (3 attempts)
- [ ] Graceful fallback if Stripe is down
- [ ] Clear error messages for common issues

---

## Task 8: Payment Method Collection

### Goal
Allow tenants to add payment methods without charging yet.

### Implementation
1. Create endpoint `POST /payments/setup-intent`
2. Create `payment-method.entity.ts` to store methods
3. Add endpoints:
   - `GET /payments/methods` - List methods
   - `POST /payments/methods` - Attach new method
   - `DELETE /payments/methods/:id` - Remove method
   - `PUT /payments/methods/:id/default` - Set default
4. Frontend: Add Stripe Elements for card input

### Requirements
- [ ] Support cards, iDEAL, SEPA debit
- [ ] Mark one method as default
- [ ] Store last4, brand, expiry for cards
- [ ] PCI compliant - no raw card data

### Tests
- [ ] Integration test: SetupIntent creation
- [ ] E2E test: Full payment method flow
- [ ] Test multiple payment methods
- [ ] Test setting/changing default

### Audit Logging
- [ ] Log payment method operations
- [ ] Mask sensitive data in logs
- [ ] Include payment method type

### Security
- [ ] Verify webhook signatures
- [ ] Rate limit payment endpoints
- [ ] Validate SetupIntent ownership

---

## Task 9: Create Stripe Subscription

### Goal
Actually create paid subscriptions in Stripe.

### Implementation
1. Create endpoint `POST /subscriptions/upgrade`
2. Implement `createSubscription` in billing service:
   - Create Stripe subscription
   - Update our database
   - Handle immediate payment
3. Add proration for mid-cycle upgrades
4. Handle 3D Secure authentication

### Requirements
- [ ] Immediate charge for upgrades
- [ ] Proration calculated correctly
- [ ] Update subscription status
- [ ] Handle SCA (3D Secure)

### Tests
- [ ] Integration test: Subscription creation
- [ ] Test proration calculations
- [ ] Test 3D Secure flow
- [ ] Test immediate vs scheduled upgrades

### Audit Logging
- [ ] Log subscription changes: `subscription.upgraded`
- [ ] Include old plan, new plan, amount
- [ ] Log payment status

### Error Handling
- [ ] Handle insufficient funds
- [ ] Handle 3D Secure required
- [ ] Clear upgrade failure messages
- [ ] Rollback on payment failure

---

## Task 10: Webhook Foundation

### Goal
Set up secure webhook handling for Stripe events.

### Implementation
1. Create `webhook.controller.ts` with:
   - `POST /webhooks/stripe` endpoint
   - Signature verification
   - Event logging
   - Basic event routing
2. Add webhook secret to config
3. Create `webhook-event.entity.ts` for idempotency
4. Set up webhook endpoint in Stripe dashboard

### Requirements
- [ ] Verify signatures on all requests
- [ ] Log all events (success and failure)
- [ ] Implement idempotency
- [ ] Return 200 quickly, process async

### Tests
- [ ] Unit test: Signature verification
- [ ] Integration test: Webhook processing
- [ ] Test duplicate event handling
- [ ] Test invalid signature rejection

### Security
- [ ] Webhook endpoint is public (no auth)
- [ ] Strict signature verification
- [ ] Rate limiting on webhook endpoint
- [ ] Log suspicious activity

---

## Task 11: Process Payment Events

### Goal
Update subscription status based on Stripe events.

### Implementation
1. Handle critical events:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
2. Update subscription status in database
3. Send notification emails
4. Handle grace period for failed payments

### Requirements
- [ ] Keep subscription status in sync
- [ ] Email on payment failures
- [ ] Restrict access after grace period
- [ ] Handle edge cases gracefully

### Tests
- [ ] Test each webhook event type
- [ ] Test status synchronization
- [ ] Test email notifications
- [ ] Test grace period logic

### Audit Logging
- [ ] Log all payment events
- [ ] Log status changes
- [ ] Include failure reasons

### Error Handling
- [ ] Don't fail webhook on processing errors
- [ ] Queue failed events for retry
- [ ] Alert on repeated failures

---

## Task 12: Frontend Subscription Pages

### Goal
Create UI for viewing subscription and usage.

### Implementation
1. Create pages:
   - `/garage-admin/subscription` - Current plan & usage
   - `/garage-admin/subscription/upgrade` - Plan selection
   - `/garage-admin/subscription/invoices` - Billing history
2. Create components:
   - `SubscriptionCard.vue` - Show current plan
   - `UsageChart.vue` - Visual usage display
   - `PlanSelector.vue` - Compare plans
3. Add Dutch translations

### Requirements
- [ ] Mobile responsive design
- [ ] Real-time usage updates
- [ ] Clear upgrade CTAs
- [ ] Show savings on higher tiers

### Tests
- [ ] Component tests for key flows
- [ ] E2E test: View subscription info
- [ ] Test responsive design
- [ ] Test loading states

### i18n
- [ ] All text in translation files
- [ ] Dutch and English support
- [ ] Format currency correctly
- [ ] Pluralization for usage

---

## Task 13: Complete Frontend Integration

### Goal
Wire up the full upgrade flow end-to-end.

### Implementation
1. Add Stripe.js to frontend
2. Create payment form with Stripe Elements
3. Handle 3D Secure authentication
4. Show success/error states
5. Redirect after successful upgrade
6. Add usage warnings throughout app

### Requirements
- [ ] PCI compliant card collection
- [ ] Handle all payment states
- [ ] Show inline validation
- [ ] Accessible form design

### Tests
- [ ] E2E test: Complete upgrade flow
- [ ] Test payment failure handling
- [ ] Test 3D Secure flow
- [ ] Test form validation

### Error Handling
- [ ] User-friendly error messages
- [ ] Retry mechanism for failures
- [ ] Support contact for issues
- [ ] Don't lose form data on errors

---

## Task 14: Admin Tools

### Goal
Give super admins tools to manage subscriptions.

### Implementation
1. Create admin endpoints:
   - View all tenant subscriptions
   - Manually adjust limits
   - Grant trial extensions
   - View payment history
2. Add admin UI pages
3. Add impersonation support

### Requirements
- [ ] Super admin only access
- [ ] Can't modify own subscription
- [ ] Audit all manual changes
- [ ] Show subscription metrics

### Tests
- [ ] Test permission restrictions
- [ ] Test manual adjustments
- [ ] Test audit logging
- [ ] E2E test: Admin workflows

### Audit Logging
- [ ] Log all admin actions
- [ ] Include reason for manual changes
- [ ] Track who made changes

---

## Task 15: Monitoring & Alerts

### Goal
Set up monitoring for subscription health.

### Implementation
1. Add metrics:
   - MRR tracking
   - Churn rate
   - Failed payments
   - Usage patterns
2. Create alerts:
   - Payment failures > 10%
   - Unusual usage spikes
   - Webhook failures
3. Add daily reconciliation job

### Requirements
- [ ] Dashboard for key metrics
- [ ] Email alerts for issues
- [ ] Slack integration (optional)
- [ ] Daily sync verification

### Tests
- [ ] Test metric calculations
- [ ] Test alert triggers
- [ ] Test reconciliation job
- [ ] Load test webhook processing

---

## Completion Checklist

Before considering the subscription system complete:

- [ ] All tasks completed with tests
- [ ] Documentation updated
- [ ] API documented in Swagger
- [ ] Frontend fully translated
- [ ] Audit logging comprehensive
- [ ] Error handling consistent
- [ ] Performance tested
- [ ] Security review done
- [ ] Monitoring in place
- [ ] Team trained on system