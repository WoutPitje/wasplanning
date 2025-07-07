import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UsageRecord } from './entities/usage-record.entity';
import { UsageService } from './services/usage.service';
import { ProrationService } from './services/proration.service';
import { LimitsService } from './services/limits.service';
import { PaymentsModule } from '../payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionPlan,
      UsageRecord,
    ]),
    forwardRef(() => PaymentsModule),
    ConfigModule,
    AuditModule,
  ],
  controllers: [SubscriptionsController],
  providers: [
    SubscriptionsService,
    UsageService,
    ProrationService,
    LimitsService,
  ],
  exports: [SubscriptionsService, UsageService, LimitsService],
})
export class SubscriptionsModule {}