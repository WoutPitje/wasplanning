import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

// Create a ConfigService instance for use outside of NestJS context
const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST') || 'localhost',
  port: configService.get('DATABASE_PORT') || 5432,
  username: configService.get('DATABASE_USERNAME') || 'wasplanning',
  password: configService.get('DATABASE_PASSWORD') || 'wasplanning_dev',
  database: configService.get('DATABASE_NAME') || 'wasplanning',
  entities: [join(__dirname, '/../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../migrations/*{.ts,.js}')],
  synchronize: false, // Never use synchronize in production
  logging: configService.get('DATABASE_LOGGING') === 'true',
  ssl: configService.get('DATABASE_SSL') === 'true',
  extra: {
    // Connection pool settings
    max: 20,
    min: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});