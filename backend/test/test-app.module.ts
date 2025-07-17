import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from '../src/auth/auth.module';
import { AdminModule } from '../src/admin/admin.module';
import { UsersModule } from '../src/users/users.module';
import { StorageModule } from '../src/storage/storage.module';
import { AuditModule } from '../src/audit/audit.module';
import { EmailModule } from '../src/email/email.module';
import { SubscriptionsModule } from '../src/subscriptions/subscriptions.module';
import { LocationsModule } from '../src/locations/locations.module';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'wasplanning',
      password: process.env.DATABASE_PASSWORD || 'wasplanning_dev',
      database: process.env.DATABASE_NAME || 'wasplanning_test',
      entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
      autoLoadEntities: true, // This ensures all entities are loaded
      synchronize: true, // Always synchronize in test environment
      dropSchema: false, // Don't drop schema - we handle this in setup
      logging: false,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
      prefix: 'wasplanning-test',
    }),
    StorageModule,
    AuthModule,
    AdminModule,
    UsersModule,
    AuditModule,
    EmailModule,
    SubscriptionsModule,
    LocationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class TestAppModule {}
