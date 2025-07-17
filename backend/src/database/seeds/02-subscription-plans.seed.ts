import { DataSource } from 'typeorm';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription-plan.entity';

export async function seedSubscriptionPlans(dataSource: DataSource) {
  const repository = dataSource.getRepository(SubscriptionPlan);

  const plans = [
    {
      name: 'free',
      display_name: 'Gratis',
      price_cents: 0,
      stripe_price_id: null,
      max_cars_per_month: 50,
      max_active_users: 2,
      max_locations: 1,
      features: {
        api_access: false,
        advanced_reporting: false,
        custom_branding: false,
        priority_support: false,
        export_data: false,
        multi_location: false,
      },
    },
    {
      name: 'standard',
      display_name: 'Standaard',
      price_cents: 10000, // €100
      stripe_price_id: 'prod_SdrXq0UVPBGOQP',
      max_cars_per_month: 1500,
      max_active_users: 10,
      max_locations: 3,
      features: {
        api_access: false,
        advanced_reporting: true,
        custom_branding: true,
        priority_support: false,
        export_data: true,
        multi_location: true,
      },
    },
    {
      name: 'enterprise',
      display_name: 'Enterprise',
      price_cents: 40000, // €400
      stripe_price_id: 'prod_SdrX3u0vH4mct1',
      max_cars_per_month: null, // unlimited
      max_active_users: null, // unlimited
      max_locations: null, // unlimited
      features: {
        api_access: true,
        advanced_reporting: true,
        custom_branding: true,
        priority_support: true,
        export_data: true,
        multi_location: true,
      },
    },
  ];

  for (const plan of plans) {
    const existing = await repository.findOne({ where: { name: plan.name } });
    if (!existing) {
      await repository.save(repository.create(plan));
      console.log(`✓ Created subscription plan: ${plan.display_name}`);
    } else {
      // Update existing plan with new Stripe price IDs
      await repository.update(
        { name: plan.name },
        { stripe_price_id: plan.stripe_price_id },
      );
      console.log(`✓ Updated subscription plan: ${plan.display_name}`);
    }
  }
}
