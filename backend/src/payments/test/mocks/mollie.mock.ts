export const mockMollieProvider = {
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  getSubscription: jest.fn(),
  createPaymentMethod: jest.fn(),
  deletePaymentMethod: jest.fn(),
  listPaymentMethods: jest.fn(),
  createPayment: jest.fn(),
  getPayment: jest.fn(),
  validateWebhook: jest.fn(),
  parseWebhook: jest.fn(),
};

export const mockMollieCustomer = {
  id: 'cst_test123',
  email: 'test@example.com',
  name: 'Test Customer',
  metadata: { tenantId: 'tenant-123' },
};

export const mockMolliePayment = {
  id: 'tr_test123',
  providerId: 'tr_test123',
  status: 'paid' as const,
  amount: 49.00,
  currency: 'EUR',
  paidAt: new Date(),
  metadata: {},
};

export const mockMollieSubscription = {
  id: 'sub_test123',
  providerId: 'sub_test123',
  status: 'active' as const,
  amount: 49.00,
  currency: 'EUR',
  interval: 'monthly' as const,
  nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  metadata: {},
};

export const mockMolliePaymentMethod = {
  id: 'mdt_test123',
  providerId: 'mdt_test123',
  type: 'sepa_debit',
  details: { consumerName: 'Test User' },
  isDefault: false,
};