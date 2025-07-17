#!/usr/bin/env ts-node
/**
 * Test script to simulate a scheduled downgrade
 * Usage: npx ts-node src/subscriptions/scripts/test-scheduled-downgrade.ts [tenant-id]
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { SubscriptionsService } from '../subscriptions.service';
import { WebhookHandlerService } from '../services/webhook-handler.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';

async function testScheduledDowngrade() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const tenantId = process.argv[2];
  if (!tenantId) {
    console.error('Please provide a tenant ID as argument');
    process.exit(1);
  }

  const subscriptionsService = app.get(SubscriptionsService);
  const webhookHandler = app.get(WebhookHandlerService);
  const subscriptionRepo = app.get<Repository<Subscription>>(
    getRepositoryToken(Subscription),
  );

  try {
    console.log(`Testing scheduled downgrade for tenant: ${tenantId}`);

    // 1. First schedule a downgrade
    console.log('\n1. Scheduling downgrade to free plan...');
    const cancelResult =
      await subscriptionsService.cancelSubscription(tenantId);
    console.log('Downgrade scheduled:', cancelResult);

    // 2. Check current state
    const subscription = await subscriptionRepo.findOne({
      where: { tenant_id: tenantId },
      relations: ['plan'],
    });

    if (!subscription) {
      throw new Error('No subscription found');
    }

    console.log('\n2. Current subscription state:');
    console.log('- Status:', subscription.status);
    console.log('- Plan:', subscription.plan?.name);
    console.log('- Cancel at period end:', subscription.cancel_at_period_end);
    console.log('- Cancel at:', subscription.cancel_at);

    // 3. Simulate the webhook event by directly updating the database
    console.log('\n3. Simulating webhook effect (subscription.deleted)...');

    // Check if this was scheduled for cancellation
    const wasScheduledForCancellation = subscription.cancel_at_period_end;

    // First, we need to delete or fully cancel the existing subscription
    // In real webhook, there's no unique constraint because the old one is marked CANCELED
    await subscriptionRepo.delete(subscription.id);
    console.log('Deleted existing subscription');

    // 2. If it was scheduled for cancellation, create a free subscription
    if (wasScheduledForCancellation) {
      // Get the free plan
      const planRepo = app.get<Repository<SubscriptionPlan>>(
        getRepositoryToken(SubscriptionPlan),
      );
      const freePlan = await planRepo.findOne({ where: { name: 'free' } });

      if (freePlan) {
        // Create a new free subscription
        const newSubscription = subscriptionRepo.create({
          tenant_id: subscription.tenant_id,
          plan: freePlan,
          status: SubscriptionStatus.ACTIVE,
          current_period_start: new Date(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        });
        await subscriptionRepo.save(newSubscription);

        console.log('Created free subscription for tenant');
      } else {
        console.log('ERROR: Free plan not found!');
      }
    }

    // 4. Check the result
    console.log('\n4. Checking result...');

    // Get all subscriptions for this tenant
    const subscriptions = await subscriptionRepo.find({
      where: { tenant_id: tenantId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    console.log(`Found ${subscriptions.length} subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`\nSubscription ${index + 1}:`);
      console.log('- ID:', sub.id);
      console.log('- Plan:', sub.plan?.name);
      console.log('- Status:', sub.status);
      console.log('- Created:', sub.created_at);
    });

    const activeFreeSub = subscriptions.find(
      (sub) =>
        sub.status === SubscriptionStatus.ACTIVE && sub.plan?.name === 'free',
    );

    if (activeFreeSub) {
      console.log('\n✅ SUCCESS: Free subscription created automatically!');
    } else {
      console.log('\n❌ ERROR: No active free subscription found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await app.close();
  }
}

testScheduledDowngrade().catch(console.error);
