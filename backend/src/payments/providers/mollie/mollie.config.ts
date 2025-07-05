export interface MollieConfig {
  apiKey: string;
  webhookUrl: string;
  testMode: boolean;
}

export const mollieConfig = {
  apiKey: process.env.MOLLIE_API_KEY || '',
  webhookUrl: process.env.MOLLIE_WEBHOOK_URL || '',
  testMode: process.env.NODE_ENV !== 'production',
};