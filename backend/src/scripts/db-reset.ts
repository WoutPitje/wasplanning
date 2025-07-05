import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'wasplanning',
  password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
  database: process.env.DATABASE_NAME || 'wasplanning',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

async function resetDatabase() {
  try {
    await dataSource.initialize();
    console.log('Data source initialized');

    // Step 1: Drop all tables (this will remove all data and migrations history)
    console.log('Dropping all tables...');
    await dataSource.dropDatabase();
    console.log('All tables dropped');

    // Step 2: Run all migrations to recreate the schema
    console.log('Running migrations...');
    await dataSource.runMigrations();
    console.log('Migrations completed');

    await dataSource.destroy();
    console.log('Database reset completed successfully');

    // Step 3: Run seed script
    console.log('\nRunning seed script...');
    const seedScript = await import('./seed');
    // The seed script should run automatically when imported
    
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      console.log('\nDatabase reset completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to reset database:', error);
      process.exit(1);
    });
}