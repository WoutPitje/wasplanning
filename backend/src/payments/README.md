# Payment Module Documentation

## Overview

The payment module provides a comprehensive payment processing system integrated with Mollie as the payment provider. It handles customer management, subscription payments, transaction tracking, and webhook processing for the car wash planning system. The module is specifically designed to support Mollie's subscription-based billing model.

## Architecture

### Module Structure

```
payments/
├── dto/
│   ├── create-payment.dto.ts           # DTO for creating payments
│   └── checkout-payment.dto.ts         # DTO for checkout payments
├── entities/
│   └── payment-transaction.entity.ts   # Records all payment transactions
├── interfaces/
│   └── payment-provider.interface.ts   # Generic payment provider interface
├── providers/
│   └── mollie/
│       ├── mollie.config.ts           # Mollie configuration
│       ├── mollie.provider.ts         # Mollie implementation
│       └── mollie.types.ts            # Mollie-specific types
├── webhooks/
│   └── webhook.controller.ts          # Handles Mollie webhooks
├── payments.controller.ts             # Main payment endpoints
├── payments.service.ts                # Core payment logic
└── payments.module.ts                 # Module definition
```

### Key Components

#### 1. **Payment Provider Interface**
- Defines a generic interface for payment providers
- Allows for future integration with other payment providers
- Current methods:
  - Customer management (create, get)
  - Subscription management (create, update, cancel, get)
  - Payment processing (checkout and direct)
  - Payment method management (list mandates)
  - Webhook validation and parsing

#### 2. **Mollie Provider**
- Implements the PaymentProvider interface
- Handles all Mollie API interactions
- Configuration:
  - API Key set via MOLLIE_API_KEY environment variable
  - Webhook URL configurable
  - Test mode in development
- Key features:
  - Mollie customer creation and management
  - Subscription creation with mandates
  - Checkout payment flow for mandate setup
  - Webhook resource verification
  - Automatic subscription description generation

#### 3. **Payment Entities**

**PaymentTransaction Entity:**
```typescript
- id: UUID
- tenantId: string
- provider: string (always 'mollie')
- providerTransactionId: string (Mollie payment ID)
- type: TransactionType (PAYMENT, REFUND, SUBSCRIPTION)
- status: TransactionStatus (PENDING, COMPLETED, FAILED, CANCELED)
- amount: decimal
- currency: string
- description: string
- metadata: JSONB (includes action, subscriptionId, etc.)
- refundedAmount: decimal (optional)
- failureReason: string (optional)
- createdAt: Date
- updatedAt: Date
```

### Payment Flows

#### 1. **Subscription Mandate Setup Flow**
```
1. User starts subscription signup
2. SubscriptionService calls createPaidSubscription()
3. PaymentsService creates/retrieves Mollie customer
4. Creates checkout payment with sequenceType: 'first'
5. Transaction stored with metadata.action: 'subscription_mandate_setup'
6. User redirected to Mollie checkout
7. Payment establishes mandate for recurring billing
8. Webhook triggers completeNewSubscription()
9. Mollie subscription created with established mandate
```

#### 2. **Plan Change Payment Flow**
```
1. User initiates plan change
2. SubscriptionService calculates proration/charges
3. If payment needed, creates checkout payment
4. Transaction stored with metadata.action: 'subscription_change'
5. User completes payment on Mollie
6. Webhook triggers completeSubscriptionChange()
7. Old Mollie subscription canceled
8. New Mollie subscription created
9. Local subscription updated with new plan
```

#### 3. **Webhook Processing Flow**
```
1. Mollie sends webhook with resource ID
2. WebhookController receives POST /payments/webhook/mollie
3. Validates webhook by fetching resource from Mollie
4. Parses webhook to determine event type
5. Updates transaction status in database
6. For subscription-related payments:
   - Checks metadata.action field
   - Triggers appropriate subscription service method
7. Returns success to Mollie
```

### API Endpoints

#### Transactions
- `GET /payments/transactions` - List all transactions
- `GET /payments/transactions/:id` - Get specific transaction

#### Internal Methods (used by SubscriptionService)
- `createCheckoutPayment()` - Create Mollie checkout payment
- `createSubscription()` - Create Mollie subscription
- `cancelSubscription()` - Cancel Mollie subscription
- `getOrCreateCustomer()` - Get/create Mollie customer
- `hasMandates()` - Check if customer has valid mandates

#### Webhooks
- `POST /payments/webhook/mollie` - Mollie webhook endpoint (no auth required)

### Security & Multi-Tenancy

1. **Tenant Isolation**
   - All payment methods scoped to tenant
   - All transactions scoped to tenant
   - Row-level security policies enforce isolation

2. **Authentication**
   - JWT required for all endpoints except webhooks
   - Role-based access control

3. **Webhook Security**
   - Webhooks validated by fetching resource from Mollie API
   - No signature validation (Mollie's recommended approach)
   - Resource existence confirms webhook authenticity

4. **Audit Trail**
   - All payment actions logged via AuditService
   - Includes amount, status changes, metadata

### Integration with Subscriptions

The payment module has a circular dependency with subscriptions, handled via `forwardRef()`:

```typescript
@Inject(forwardRef(() => SubscriptionsService))
private subscriptionsService: SubscriptionsService
```

Key integration points:
1. **Subscription Creation**: Creates checkout payment for mandate setup
2. **Mollie Subscription**: Creates/manages Mollie subscriptions
3. **Plan Changes**: Handles payment for plan upgrades
4. **Webhook Processing**: Routes subscription events to proper handlers
5. **Customer Management**: Shared Mollie customer across services
6. **Metadata Exchange**: Action field determines webhook routing

### Configuration

Environment variables needed:
```bash
# Mollie Configuration (Required)
MOLLIE_API_KEY=your_mollie_api_key

# Optional - defaults to localhost webhook URL
MOLLIE_WEBHOOK_URL=https://your-domain.com/api/v1/payments/webhook/mollie
```

### Testing

The module includes:
- Unit tests for PaymentsService
- Mock Mollie provider for testing
- E2E tests for payment flows
- Test fixtures for consistent test data

Example test setup:
```typescript
const mockMollieProvider = {
  createCustomer: jest.fn(),
  createPayment: jest.fn(),
  getPayment: jest.fn(),
  // ... other methods
};
```

### Current Implementation Status

✅ **Completed**
- Mollie customer management
- Checkout payment flow for mandate setup
- Mollie subscription creation and management
- Webhook processing with resource validation
- Transaction tracking and status updates
- Integration with subscription service
- Multi-tenant isolation

⚠️ **Partial Implementation**
- Payment method management (mandates only, no UI)
- Error handling (basic implementation)

❌ **Not Implemented**
- Direct payment method creation
- Refund functionality
- Payment retry logic
- Analytics and reporting

### Future Enhancements

1. **Payment Method Management**
   - UI for managing payment methods
   - Multiple payment methods per customer
   - Default payment method selection

2. **Refunds**
   - Full and partial refund support
   - Refund reason tracking
   - Automatic refund processing

3. **Enhanced Error Handling**
   - Retry logic for failed API calls
   - Better error messages for users
   - Payment failure recovery flows

4. **Analytics & Reporting**
   - Revenue dashboard
   - Payment success rates
   - Failed payment analysis
   - Transaction history exports

## Usage Examples

### Creating a Subscription Payment
```typescript
// In SubscriptionService
const payment = await this.paymentsService.createCheckoutPayment(
  tenantId,
  {
    amount: 49.00,
    currency: 'EUR',
    description: 'Starter Plan - Monthly Subscription',
    customerId: mollieCustomerId,
    redirectUrl: 'https://app.com/payment-return',
    metadata: {
      tenantId,
      subscriptionId,
      action: 'subscription_mandate_setup',
      planName: 'starter'
    },
    sequenceType: 'first' // Establishes mandate
  }
);

// Returns checkout URL for redirect
return { checkoutUrl: payment.checkoutUrl };
```

### Creating a Mollie Subscription
```typescript
// After mandate is established
const mollieSubscription = await this.paymentsService.createSubscription({
  customerId: mollieCustomerId,
  amount: 49.00,
  currency: 'EUR',
  interval: 'monthly',
  description: 'Starter Plan - 2025-07-07',
  metadata: {
    tenantId,
    subscriptionId,
    planName: 'starter'
  }
});
```

### Handling Webhooks
```typescript
// WebhookController processes events automatically
// Example webhook handling for subscription payment:

1. Mollie sends: { id: "tr_ArzZmvnWgM" }
2. Controller validates by fetching payment from Mollie
3. Checks payment.metadata.action:
   - "subscription_mandate_setup" → completeNewSubscription()
   - "subscription_change" → completeSubscriptionChange()
4. Updates transaction status
5. Subscription service handles the rest
```

## Troubleshooting

### Common Issues

1. **"Subscription already exists" Error**
   - Mollie requires unique descriptions per customer
   - Solution: Include date in subscription description
   - Fixed by appending ISO date to description

2. **Webhook Payment ID Mismatch**
   - Different payment IDs in logs vs webhooks
   - Could be due to test mode or multiple environments
   - Verify webhook URL matches environment

3. **No Valid Mandate Error**
   - Customer has no payment method set up
   - First payment must use sequenceType: 'first'
   - Check mandate status in Mollie dashboard

4. **Transaction Not Found in Webhook**
   - Transaction created with different provider ID
   - Check for typos in payment ID logging
   - Verify transaction was saved to database

### Debug Mode

Enable debug logging:
```typescript
// In payments.service.ts
private readonly logger = new Logger(PaymentsService.name);
// Logs are automatically written for all operations
```

## Best Practices

1. **Always Store Transaction Records**
   - Create local record before API call
   - Update status via webhooks
   - Never trust frontend for payment status

2. **Use Metadata Effectively**
   - Include context for webhook processing
   - Store tenant/subscription/user info
   - Enable proper payment attribution

3. **Handle Failures Gracefully**
   - Provide clear error messages
   - Log all failures for debugging
   - Implement retry mechanisms

4. **Test Thoroughly**
   - Use Mollie test mode
   - Test all payment scenarios
   - Verify webhook handling