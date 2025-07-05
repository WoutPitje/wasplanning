export interface MollieCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, any>;
}

export interface MolliePayment {
  id: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  status: 'open' | 'canceled' | 'pending' | 'authorized' | 'expired' | 'failed' | 'paid';
  paidAt?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  sequenceType?: 'oneoff' | 'first' | 'recurring';
  mandateId?: string;
  subscriptionId?: string;
}

export interface MollieSubscription {
  id: string;
  customerId: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  status: 'pending' | 'active' | 'canceled' | 'suspended' | 'completed';
  interval: string;
  nextPaymentDate?: string;
  metadata?: Record<string, any>;
}

export interface MollieMandate {
  id: string;
  customerId: string;
  status: 'pending' | 'valid' | 'invalid';
  method: 'directdebit' | 'creditcard';
  details: Record<string, any>;
}

export interface MollieWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
  };
  createdAt: string;
}