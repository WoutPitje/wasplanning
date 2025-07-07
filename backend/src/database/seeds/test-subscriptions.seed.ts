import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../../auth/entities/tenant.entity';
import { User, UserRole } from '../../auth/entities/user.entity';
import { SubscriptionPlan, PlanName } from '../../subscriptions/entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus, BillingInterval } from '../../subscriptions/entities/subscription.entity';

export async function seedTestSubscriptions(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository(Tenant);
  const userRepository = dataSource.getRepository(User);
  const subscriptionPlanRepository = dataSource.getRepository(SubscriptionPlan);
  const subscriptionRepository = dataSource.getRepository(Subscription);

  console.log('🌱 Seeding Test Subscriptions...');

  // Get subscription plans
  const starterPlan = await subscriptionPlanRepository.findOne({ where: { name: PlanName.STARTER } });
  const groeiPlan = await subscriptionPlanRepository.findOne({ where: { name: PlanName.GROEI } });
  const enterprisePlan = await subscriptionPlanRepository.findOne({ where: { name: PlanName.ENTERPRISE } });

  if (!starterPlan || !groeiPlan || !enterprisePlan) {
    throw new Error('Subscription plans not found. Please run subscription plans seed first.');
  }

  // Test scenarios
  const testScenarios = [
    {
      // Scenario 1: Active subscription with credits
      tenant: {
        name: 'garage-active',
        displayName: 'Garage Active (With Credits)',
        isActive: true,
      },
      user: {
        email: 'admin@garage-active.nl',
        firstName: 'Jan',
        lastName: 'Pietersen',
        password: 'Test123!',
      },
      subscription: {
        plan: groeiPlan,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTH,
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        creditBalance: 85.50, // Has credits from previous downgrade
        trialEnd: null,
        cancelAtPeriodEnd: false,
      },
    },
    {
      // Scenario 2: Expired subscription (past due)
      tenant: {
        name: 'garage-expired',
        displayName: 'Garage Expired (Past Due)',
        isActive: true,
      },
      user: {
        email: 'admin@garage-expired.nl',
        firstName: 'Karin',
        lastName: 'de Vries',
        password: 'Test123!',
      },
      subscription: {
        plan: starterPlan,
        status: SubscriptionStatus.PAST_DUE,
        billingInterval: BillingInterval.MONTH,
        currentPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
        currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (expired)
        creditBalance: 0,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        nextPaymentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Payment was due 5 days ago
      },
    },
    {
      // Scenario 3: Trial expiring soon
      tenant: {
        name: 'garage-trial',
        displayName: 'Garage Trial (Expiring Soon)',
        isActive: true,
      },
      user: {
        email: 'admin@garage-trial.nl',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        password: 'Test123!',
      },
      subscription: {
        plan: enterprisePlan,
        status: SubscriptionStatus.TRIALING,
        billingInterval: BillingInterval.YEAR,
        currentPeriodStart: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from start
        creditBalance: 0,
        trialEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Trial ends in 5 days
        cancelAtPeriodEnd: false,
      },
    },
    {
      // Scenario 4: Canceled but still active until period end
      tenant: {
        name: 'garage-canceled',
        displayName: 'Garage Canceled (Active Until Period End)',
        isActive: true,
      },
      user: {
        email: 'admin@garage-canceled.nl',
        firstName: 'Maria',
        lastName: 'Rodriguez',
        password: 'Test123!',
      },
      subscription: {
        plan: groeiPlan,
        status: SubscriptionStatus.ACTIVE,
        billingInterval: BillingInterval.MONTH,
        currentPeriodStart: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        creditBalance: 125.75, // Had significant credits
        trialEnd: null,
        cancelAtPeriodEnd: true, // Scheduled for cancellation
        canceledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Canceled 3 days ago
      },
    },
    {
      // Scenario 5: Completely canceled subscription
      tenant: {
        name: 'garage-terminated',
        displayName: 'Garage Terminated (Fully Canceled)',
        isActive: false, // Tenant deactivated
      },
      user: {
        email: 'admin@garage-terminated.nl',
        firstName: 'Peter',
        lastName: 'Janssen',
        password: 'Test123!',
      },
      subscription: {
        plan: starterPlan,
        status: SubscriptionStatus.CANCELED,
        billingInterval: BillingInterval.MONTH,
        currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        currentPeriodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        creditBalance: 0,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        canceledAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Canceled 15 days ago
      },
    },
  ];

  // Create test scenarios
  for (const scenario of testScenarios) {
    // Check if tenant already exists
    const existingTenant = await tenantRepository.findOne({
      where: { name: scenario.tenant.name },
    });

    let tenant: Tenant;
    let user: User;

    if (!existingTenant) {
      // Create tenant
      tenant = tenantRepository.create({
        name: scenario.tenant.name,
        display_name: scenario.tenant.displayName,
        is_active: scenario.tenant.isActive,
        language: 'nl',
      });
      await tenantRepository.save(tenant);

      // Create user
      const hashedPassword = await bcrypt.hash(scenario.user.password, 12);
      user = userRepository.create({
        email: scenario.user.email,
        password: hashedPassword,
        first_name: scenario.user.firstName,
        last_name: scenario.user.lastName,
        role: UserRole.GARAGE_ADMIN,
        tenant_id: tenant.id,
        is_active: true,
      });
      await userRepository.save(user);

      // Create subscription
      const subscription = subscriptionRepository.create({
        tenantId: tenant.id,
        planId: scenario.subscription.plan.id,
        status: scenario.subscription.status,
        billingInterval: scenario.subscription.billingInterval,
        currentPeriodStart: scenario.subscription.currentPeriodStart,
        currentPeriodEnd: scenario.subscription.currentPeriodEnd,
        creditBalance: scenario.subscription.creditBalance || 0,
        trialEnd: scenario.subscription.trialEnd,
        cancelAtPeriodEnd: scenario.subscription.cancelAtPeriodEnd,
        canceledAt: scenario.subscription.canceledAt,
        nextPaymentDate: scenario.subscription.nextPaymentDate,
        metadata: {
          createdViaSeeds: true,
          scenario: scenario.tenant.displayName,
        },
      });
      await subscriptionRepository.save(subscription);

      console.log(`✅ Created test scenario: ${scenario.tenant.displayName}`);
      console.log(`   📧 Login: ${scenario.user.email}`);
      console.log(`   🔑 Password: ${scenario.user.password}`);
      console.log(`   📊 Plan: ${scenario.subscription.plan.displayName}`);
      console.log(`   🔄 Status: ${scenario.subscription.status}`);
      console.log(`   💰 Credits: €${scenario.subscription.creditBalance || 0}`);
      if (scenario.subscription.trialEnd) {
        console.log(`   🆓 Trial ends: ${scenario.subscription.trialEnd.toLocaleDateString()}`);
      }
      if (scenario.subscription.cancelAtPeriodEnd) {
        console.log(`   ❌ Canceling at period end: ${scenario.subscription.currentPeriodEnd.toLocaleDateString()}`);
      }
      console.log('');
    } else {
      console.log(`⏭️  Test scenario already exists: ${scenario.tenant.displayName}`);
    }
  }

  console.log('🎉 Test subscription scenarios seeded successfully!');
  console.log('');
  console.log('📋 Test Scenarios Summary:');
  console.log('1. garage-active: Active subscription with €85.50 credits');
  console.log('2. garage-expired: Past due subscription (expired 5 days ago)');
  console.log('3. garage-trial: Enterprise trial expiring in 5 days');
  console.log('4. garage-canceled: Scheduled for cancellation with €125.75 credits');
  console.log('5. garage-terminated: Fully canceled and deactivated');
  console.log('');
  console.log('🔑 All test accounts use password: Test123!');
}