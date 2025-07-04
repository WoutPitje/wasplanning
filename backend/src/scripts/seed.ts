import { DataSource } from 'typeorm';
import { runSeeds } from '../database/seeds';
import { User } from '../auth/entities/user.entity';
import { Tenant } from '../auth/entities/tenant.entity';

async function bootstrap() {
  // Create DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'wasplanning',
    password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
    database: process.env.DATABASE_NAME || 'wasplanning',
    entities: [User, Tenant],
    synchronize: false, // Don't auto-sync in production
    logging: false,
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Database connected');

    await runSeeds(dataSource);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

bootstrap();