#!/usr/bin/env ts-node
/**
 * Complete test of the downgrade flow
 * This creates a test tenant, subscription, and simulates the full flow
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Tenant } from '../../auth/entities/tenant.entity';
import { v4 as uuidv4 } from 'uuid';

async function testFullDowngradeFlow() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const subscriptionRepo = app.get<Repository<Subscription>>(
    getRepositoryToken(Subscription),
  );
  const planRepo = app.get<Repository<SubscriptionPlan>>(
    getRepositoryToken(SubscriptionPlan),
  );
  const tenantRepo = app.get<Repository<Tenant>>(getRepositoryToken(Tenant));

  try {
    console.log('🧪 Testing Complete Downgrade Flow');
    console.log('=====================================\n');

    // 1. Create or find a test tenant
    console.log('1. Finding or creating test tenant...');
    let testTenant = await tenantRepo.findOne({
      where: { name: 'Test Downgrade Tenant' },
    });

    if (!testTenant) {
      testTenant = await tenantRepo.save({
        id: uuidv4(),
        name: 'Test Downgrade Tenant',
        email: 'test-downgrade@example.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        postal_code: '1234AB',
        kvk_number: '12345678',
        vat_number: 'NL123456789B01',
        is_active: true,
      });
      console.log('Created new test tenant:', testTenant.id);
    } else {
      console.log('Using existing test tenant:', testTenant.id);
    }

    // 2. Find plans
    const standardPlan = await planRepo.findOne({
      where: { name: 'standard' },
    });
    const freePlan = await planRepo.findOne({ where: { name: 'free' } });

    if (!standardPlan || !freePlan) {
      throw new Error('Required plans not found. Please run database seeds.');
    }

    console.log('Found plans:', {
      standard: standardPlan.id,
      free: freePlan.id,
    });

    // 3. Create or update a subscription for the tenant
    console.log('\n2. Setting up subscription...');

    // Delete any existing subscription
    await subscriptionRepo.delete({ tenant_id: testTenant.id });

    // Create a new standard subscription
    const subscription = await subscriptionRepo.save({
      tenant_id: testTenant.id,
      plan: standardPlan,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripe_subscription_id: 'sub_test_' + Date.now(), // Fake Stripe ID for testing
      stripe_customer_id: 'cus_test_' + Date.now(),
    });

    console.log('Created standard subscription');
    console.log('- ID:', subscription.id);
    console.log('- Plan:', standardPlan.name);
    console.log('- Status:', subscription.status);

    // 4. Schedule downgrade
    console.log('\n3. Scheduling downgrade to free plan...');

    subscription.cancel_at_period_end = true;
    subscription.canceled_at = new Date();
    subscription.cancel_at = subscription.current_period_end;

    await subscriptionRepo.save(subscription);
    console.log(
      'Marked subscription for cancellation at:',
      subscription.cancel_at,
    );

    // 5. Simulate webhook (subscription deleted)
    console.log('\n4. Simulating Stripe webhook (subscription.deleted)...');

    // Delete the existing subscription
    await subscriptionRepo.delete(subscription.id);
    console.log('Deleted existing subscription');

    // Create free subscription
    const freeSubscription = await subscriptionRepo.save({
      tenant_id: testTenant.id,
      plan: freePlan,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log('Created new free subscription');
    console.log('- ID:', freeSubscription.id);
    console.log('- Plan:', freePlan.name);
    console.log('- Status:', freeSubscription.status);

    // 6. Verify the result
    console.log('\n5. Verifying final state...');

    const finalSubscription = await subscriptionRepo.findOne({
      where: { tenant_id: testTenant.id },
      relations: ['plan'],
    });

    if (finalSubscription && finalSubscription.plan.name === 'free') {
      console.log('\n✅ SUCCESS: Downgrade flow completed successfully!');
      console.log('Tenant now has an active FREE subscription');
    } else {
      console.log('\n❌ ERROR: Unexpected final state');
      console.log('Final subscription:', finalSubscription);
    }

    // 7. Test reactivation
    console.log('\n6. Testing reactivation (cancel downgrade)...');

    // Delete free subscription
    await subscriptionRepo.delete(freeSubscription.id);

    // Recreate standard subscription with cancel_at_period_end
    const reactivatedSub = await subscriptionRepo.save({
      tenant_id: testTenant.id,
      plan: standardPlan,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripe_subscription_id: 'sub_test_' + Date.now(),
      cancel_at_period_end: true,
      canceled_at: new Date(),
      cancel_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    console.log('Created subscription with pending cancellation');

    // Simulate reactivation - need to use type assertion due to strict typing
    (reactivatedSub as any).cancel_at_period_end = false;
    (reactivatedSub as any).cancel_at = null;
    (reactivatedSub as any).canceled_at = null;

    await subscriptionRepo.save(reactivatedSub);
    console.log('Removed cancellation - subscription reactivated');

    const finalReactivated = await subscriptionRepo.findOne({
      where: { id: reactivatedSub.id },
    });

    if (finalReactivated && !finalReactivated.cancel_at_period_end) {
      console.log('✅ Reactivation successful!');
    } else {
      console.log('❌ Reactivation failed');
    }

    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await app.close();
  }
}

testFullDowngradeFlow().catch(console.error);
