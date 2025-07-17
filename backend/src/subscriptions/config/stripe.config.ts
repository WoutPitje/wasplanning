import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000, // milliseconds

  // API version
  apiVersion: '2025-06-30.basil' as const,

  // Test mode detection
  isTestMode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || true,

  // Metadata keys
  metadataKeys: {
    tenantId: 'tenant_id',
    tenantName: 'tenant_name',
    environment: 'environment',
  },
}));
