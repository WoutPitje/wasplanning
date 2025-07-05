import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables
config({ path: '.env.test' });

const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'wasplanning',
  password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
  database: process.env.DATABASE_NAME || 'wasplanning_test',
  entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../src/migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
});

export async function setupTestDatabase() {
  await testDataSource.initialize();
  
  // Drop all tables
  await testDataSource.dropDatabase();
  
  // Run migrations
  await testDataSource.runMigrations();
  
  await testDataSource.destroy();
}

// Run if called directly
if (require.main === module) {
  setupTestDatabase()
    .then(() => {
      console.log('Test database setup complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error setting up test database:', error);
      process.exit(1);
    });
}