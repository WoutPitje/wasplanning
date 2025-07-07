import { DataSource } from 'typeorm';
import { seedSuperAdmin } from './super-admin.seed';
import { seedSubscriptionPlans } from './subscription-plans.seed';
import { seedTestSubscriptions } from './test-subscriptions.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    await seedSuperAdmin(dataSource);
    await seedSubscriptionPlans(dataSource);
    
    // Add test subscriptions if in development
    if (process.env.NODE_ENV !== 'production') {
      await seedTestSubscriptions(dataSource);
    }
    
    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
