# Payment Module Documentation

## Overview

The payment module provides a comprehensive payment processing system integrated with Mollie as the payment provider. It handles payment methods, one-time payments, transaction tracking, and webhook processing for the car wash planning system.

## Architecture

### Module Structure

```
payments/
├── dto/
│   ├── create-payment-method.dto.ts    # DTO for creating payment methods
│   ├── process-payment.dto.ts          # DTO for processing payments
│   └── webhook.dto.ts                  # DTO for webhook payloads
├── entities/
│   ├── payment-method.entity.ts        # Stores payment methods per tenant
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
  - Customer management (create, get, update)
  - Payment method management
  - Payment processing (one-time and subscriptions)
  - Webhook handling

#### 2. **Mollie Provider**
- Implements the PaymentProvider interface
- Handles all Mollie API interactions
- Configuration:
  - Test API Key: `test_abWq5tSnzuyseaT22rFPVRHG67uCbd`
  - Production key should be set via environment variable
- Supports various payment methods:
  - Credit card
  - SEPA Direct Debit
  - iDEAL (Dutch payment method)
  - Bank transfer

#### 3. **Payment Entities**

**PaymentMethod Entity:**
```typescript
- id: UUID
- tenantId: string (multi-tenant isolation)
- providerId: string (Mollie mandate ID)
- type: PaymentMethodType (card, sepa_debit, ideal, etc.)
- details: JSONB (card last 4 digits, bank info, etc.)
- isDefault: boolean
- isActive: boolean
- createdAt: Date
- updatedAt: Date
```

**PaymentTransaction Entity:**
```typescript
- id: UUID
- tenantId: string
- providerId: string (Mollie payment ID)
- type: TransactionType (PAYMENT, REFUND, SUBSCRIPTION)
- status: TransactionStatus (PENDING, COMPLETED, FAILED, CANCELED)
- amount: decimal
- currency: string
- description: string
- metadata: JSONB
- paymentMethodId: UUID (optional)
- subscriptionId: UUID (optional)
- refundedAmount: decimal (optional)
- failureReason: string (optional)
- createdAt: Date
- updatedAt: Date
```

### Payment Flows

#### 1. **One-Time Payment Flow**
```
1. Frontend calls POST /payments/charge
2. PaymentsService creates/retrieves Mollie customer
3. Creates payment with Mollie API
4. Stores transaction record locally (PENDING status)
5. Returns checkout URL to frontend
6. User completes payment on Mollie checkout page
7. Mollie sends webhook to /payments/webhook/mollie
8. Webhook updates transaction status
9. Triggers downstream actions based on metadata
```

#### 2. **Subscription Payment Flow**
```
1. Subscription service initiates payment for plan change/creation
2. PaymentsService.createCheckoutPayment() called with metadata
3. Payment created with subscription context in metadata
4. User redirected to Mollie checkout
5. On successful payment, webhook triggers:
   - SubscriptionsService.completeSubscriptionChange() OR
   - SubscriptionsService.completeNewSubscription()
6. Subscription updated/activated based on payment success
```

#### 3. **Payment Method Management**
```
1. Frontend calls POST /payments/methods
2. Creates payment method record
3. Links to Mollie customer/mandate
4. Can set as default payment method
5. Used for future recurring payments
```

### API Endpoints

#### Payment Methods
- `POST /payments/methods` - Create new payment method
- `GET /payments/methods` - List tenant's payment methods
- `DELETE /payments/methods/:id` - Delete payment method
- `PATCH /payments/methods/:id/set-default` - Set as default

#### Transactions
- `POST /payments/charge` - Process one-time payment
- `GET /payments/transactions` - List all transactions with filters
- `GET /payments/transactions/:id` - Get specific transaction details

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
   - TODO: Implement Mollie signature validation
   - Currently accepts all webhooks (security risk in production)

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
1. **Subscription Creation**: Creates checkout payment for initial subscription
2. **Plan Changes**: Processes upgrade/downgrade payments
3. **Payment Completion**: Notifies subscription service via webhooks
4. **Metadata Exchange**: Payment metadata includes subscription context

### Configuration

Environment variables needed:
```bash
# Mollie Configuration
MOLLIE_API_KEY=test_abWq5tSnzuyseaT22rFPVRHG67uCbd
MOLLIE_WEBHOOK_URL=https://your-domain.com/api/v1/payments/webhook/mollie

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
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

### Future Enhancements

1. **Webhook Signature Validation** (Critical)
   - Implement proper Mollie webhook verification
   - Reject unsigned/invalid webhooks

2. **Recurring Payments**
   - Full Mollie subscription implementation
   - Automatic recurring billing
   - Failed payment retry logic

3. **Refunds**
   - Implement refund functionality
   - Partial refund support
   - Refund reason tracking

4. **Additional Payment Providers**
   - Stripe integration
   - PayPal support
   - Provider selection per tenant

5. **Enhanced Error Handling**
   - Retry logic for failed API calls
   - Better error messages for users
   - Payment failure recovery flows

6. **Payment Analytics**
   - Revenue reporting
   - Failed payment analytics
   - Payment method usage statistics

## Usage Examples

### Creating a Payment Method
```typescript
// Frontend
const { createPaymentMethod } = usePayments();

await createPaymentMethod({
  type: 'sepa_debit',
  details: {
    iban: 'NL89RABO0123456789',
    name: 'John Doe'
  }
});
```

### Processing a Payment
```typescript
// Frontend
const { processPayment } = usePayments();

const result = await processPayment({
  amount: 49.00,
  description: 'Starter Plan - Monthly',
  paymentMethodId: 'pm_123',
  metadata: {
    planName: 'starter',
    billingInterval: 'month'
  }
});

// Redirect to checkout
window.location.href = result.checkoutUrl;
```

### Handling Webhooks
The webhook controller automatically:
1. Receives Mollie webhooks
2. Updates transaction status
3. Triggers subscription actions if needed
4. Logs all webhook events

## Troubleshooting

### Common Issues

1. **Payment Fails to Process**
   - Check Mollie API key is valid
   - Verify customer exists in Mollie
   - Check payment method is active

2. **Webhook Not Received**
   - Verify webhook URL is publicly accessible
   - Check Mollie webhook configuration
   - Review webhook logs in Mollie dashboard

3. **Transaction Status Not Updating**
   - Check webhook processing logs
   - Verify transaction exists in database
   - Check for webhook processing errors

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