export interface CreateSubscriptionParams {
  amount: number;
  currency: string;
  description: string;
  interval: 'monthly' | 'yearly';
  customerId: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
  mandateId?: string;
  times?: number;
}

export interface UpdateSubscriptionParams {
  amount?: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentMethodParams {
  customerId: string;
  type: string;
  details: Record<string, any>;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  description: string;
  customerId: string;
  paymentMethodId?: string;
  metadata?: Record<string, any>;
}

export interface Subscription {
  id: string;
  providerId: string;
  status: 'active' | 'canceled' | 'cancelled' | 'suspended' | 'pending' | 'paused' | 'completed';
  amount: number;
  currency: string;
  interval: string;
  nextPaymentDate: Date;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  providerId: string;
  type: string;
  details: Record<string, any>;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  providerId: string;
  status: 'pending' | 'paid' | 'failed' | 'canceled';
  amount: number;
  currency: string;
  paidAt?: Date;
  metadata?: Record<string, any>;
  subscriptionId?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
}

export interface PaymentProvider {
  // Customer management
  createCustomer(email: string, name?: string, metadata?: Record<string, any>): Promise<string>;
  
  // Subscription management
  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  updateSubscription(id: string, params: UpdateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(id: string): Promise<void>;
  getSubscription(id: string): Promise<Subscription>;
  
  // Payment methods
  createPaymentMethod(params: CreatePaymentMethodParams): Promise<PaymentMethod>;
  deletePaymentMethod(id: string): Promise<void>;
  listPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  
  // One-time payments
  createPayment(params: CreatePaymentParams): Promise<Payment>;
  getPayment(id: string): Promise<Payment>;
  
  // Webhooks
  validateWebhook(body: any, signature: string): Promise<boolean>;
  parseWebhook(body: any): WebhookEvent;
}