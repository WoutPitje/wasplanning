import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables
config({ path: '.env.test' });

export const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'wasplanning',
  password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
  database: process.env.DATABASE_NAME || 'wasplanning_test',
  entities: [path.join(__dirname, '../src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../src/migrations/*{.ts,.js}')],
  synchronize: true, // Enable for test environment to auto-create tables
  dropSchema: true, // Drop schema before each test run
  logging: false,
});

export async function setupTestDatabase() {
  try {
    await testDataSource.initialize();
    console.log('Test database initialized');
    
    // Drop and recreate schema to ensure clean state
    await testDataSource.synchronize(true);
    console.log('Test database schema synchronized');
  } catch (error) {
    console.error('Error initializing test database:', error);
    throw error;
  }
}

export async function teardownTestDatabase() {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
    console.log('Test database connection closed');
  }
}