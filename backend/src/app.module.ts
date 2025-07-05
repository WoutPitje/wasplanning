import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { AuditModule } from './audit/audit.module';

import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbSyncValue = configService.get('DB_SYNC');

        // Only allow synchronize if explicitly set to 'true' AND in development
        const synchronize =
          dbSyncValue === 'true' &&
          configService.get('NODE_ENV') === 'development';

        // Log warning if sync is disabled for safety
        if (
          dbSyncValue === 'true' &&
          configService.get('NODE_ENV') !== 'development'
        ) {
          console.warn(
            '⚠️  DB_SYNC=true ignored in non-development environment for safety',
          );
        }

        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST') || 'localhost',
          port: configService.get('DATABASE_PORT') || 5432,
          username: configService.get('DATABASE_USERNAME') || 'wasplanning',
          password: configService.get('DATABASE_PASSWORD') || 'wasplanning_dev',
          database: configService.get('DATABASE_NAME') || 'wasplanning',
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: synchronize,
          logging: configService.get('DATABASE_LOGGING') === 'true',
        };
      },
      inject: [ConfigService],
    }),
    StorageModule,
    AuthModule,
    AdminModule,
    UsersModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
