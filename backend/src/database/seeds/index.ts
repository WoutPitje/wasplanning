import { DataSource } from 'typeorm';
import { seedSuperAdmin } from './super-admin.seed';

export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Starting database seeding...');
  
  try {
    await seedSuperAdmin(dataSource);
    console.log('✅ All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}