import { config } from 'dotenv';
import * as path from 'path';
import Stripe from 'stripe';

// Load environment variables
config({ path: path.join(__dirname, '../../../.env') });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

interface PriceConfig {
  name: string;
  displayName: string;
  amountCents: number;
  lookupKey: string;
}

const prices: PriceConfig[] = [
  {
    name: 'standard',
    displayName: 'Standaard',
    amountCents: 10000, // €100
    lookupKey: 'standard_monthly',
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    amountCents: 40000, // €400
    lookupKey: 'enterprise_monthly',
  },
];

async function createPrices() {
  console.log('Creating Stripe prices...\n');

  const createdPrices: { [key: string]: string } = {};

  for (const priceConfig of prices) {
    try {
      // Create product first
      const product = await stripe.products.create({
        name: `Wasplanning ${priceConfig.displayName}`,
        description: `${priceConfig.displayName} subscription for Wasplanning`,
      });

      console.log(`✓ Created product: ${product.name} (${product.id})`);

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: priceConfig.amountCents,
        recurring: {
          interval: 'month',
        },
        lookup_key: priceConfig.lookupKey,
        metadata: {
          plan_name: priceConfig.name,
        },
      });

      console.log(
        `✓ Created price: ${price.id} for ${priceConfig.displayName} (€${priceConfig.amountCents / 100}/month)`,
      );
      createdPrices[priceConfig.name] = price.id;
    } catch (error) {
      console.error(`✗ Error creating price for ${priceConfig.name}:`, error);
    }
  }

  console.log('\n=== Created Price IDs ===');
  console.log('Update your database with these price IDs:\n');

  console.log(
    `UPDATE subscription_plans SET stripe_price_id = '${createdPrices.standard}' WHERE name = 'standard';`,
  );
  console.log(
    `UPDATE subscription_plans SET stripe_price_id = '${createdPrices.enterprise}' WHERE name = 'enterprise';`,
  );
  console.log(
    `UPDATE subscription_plans SET stripe_price_id = NULL WHERE name = 'free';`,
  );

  console.log(
    '\nDone! These prices are now available in your Stripe dashboard.',
  );
}

createPrices().catch(console.error);
