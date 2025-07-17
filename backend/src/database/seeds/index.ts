import { DataSource } from 'typeorm';
import { seedSuperAdmin } from './super-admin.seed';
import { seedSubscriptionPlans } from './02-subscription-plans.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed subscription plans first (no dependencies)
    await seedSubscriptionPlans(dataSource);

    // Then seed super admin
    await seedSuperAdmin(dataSource);

    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
