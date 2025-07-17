import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant } from '../auth/entities/tenant.entity';
import { User } from '../auth/entities/user.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from '../subscriptions/entities/subscription-plan.entity';
import { UsageRecord } from '../subscriptions/entities/usage-record.entity';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant,
      User,
      Subscription,
      SubscriptionPlan,
      UsageRecord,
    ]),
    AuthModule,
    StorageModule,
    AuditModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class AdminModule {}
