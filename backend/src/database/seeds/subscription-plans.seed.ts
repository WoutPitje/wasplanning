import { DataSource } from 'typeorm';
import { SubscriptionPlan, PlanName, BillingType } from '../../subscriptions/entities/subscription-plan.entity';

export async function seedSubscriptionPlans(dataSource: DataSource): Promise<void> {
  const subscriptionPlanRepository = dataSource.getRepository(SubscriptionPlan);

  // Check if plans already exist
  const existingPlans = await subscriptionPlanRepository.count();
  if (existingPlans > 0) {
    console.log('Subscription plans already exist, skipping seed');
    return;
  }

  const plans: Partial<SubscriptionPlan>[] = [
    {
      name: PlanName.STARTER,
      displayName: 'Starter',
      priceMonthly: 49.00,
      priceYearly: 49.00 * 12 * 0.9, // 10% discount for yearly
      billingType: BillingType.SUBSCRIPTION,
      maxLocations: 1,
      maxCarsPerMonth: 500,
      maxUsers: 5,
      features: {
        basic_features: true,
        advanced_reporting: false,
        api_access: false,
        priority_support: false,
        custom_branding: false,
        multi_location: false,
        cross_location_planning: false,
      },
      overagePricePerCar: undefined,
      overagePricePerLocation: undefined,
      isActive: true,
    },
    {
      name: PlanName.GROEI,
      displayName: 'Groei',
      priceMonthly: 149.00,
      priceYearly: 149.00 * 12 * 0.9, // 10% discount for yearly
      billingType: BillingType.HYBRID,
      maxLocations: 3,
      maxCarsPerMonth: 2000,
      maxUsers: undefined, // unlimited
      features: {
        basic_features: true,
        advanced_reporting: true,
        api_access: true,
        priority_support: true,
        custom_branding: false,
        multi_location: true,
        cross_location_planning: true,
      },
      overagePricePerCar: 0.10,
      overagePricePerLocation: 39.00,
      isActive: true,
    },
    {
      name: PlanName.ENTERPRISE,
      displayName: 'Enterprise',
      priceMonthly: 299.00,
      priceYearly: 299.00 * 12 * 0.9, // 10% discount for yearly
      billingType: BillingType.SUBSCRIPTION,
      maxLocations: undefined, // unlimited
      maxCarsPerMonth: undefined, // unlimited
      maxUsers: undefined, // unlimited
      features: {
        basic_features: true,
        advanced_reporting: true,
        api_access: true,
        priority_support: true,
        custom_branding: true,
        multi_location: true,
        cross_location_planning: true,
        custom_integrations: true,
        dedicated_support: true,
        sla_guarantee: true,
        franchise_management: true,
      },
      overagePricePerCar: undefined,
      overagePricePerLocation: undefined,
      isActive: true,
    },
  ];

  for (const planData of plans) {
    const plan = subscriptionPlanRepository.create(planData);
    await subscriptionPlanRepository.save(plan);
    console.log(`Created subscription plan: ${plan.displayName}`);
  }

  console.log('Subscription plans seeded successfully');
}