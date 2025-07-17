import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UsageRecord } from './entities/usage-record.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { User } from '../auth/entities/user.entity';
import { Tenant } from '../auth/entities/tenant.entity';
import { Location } from '../locations/entities/location.entity';
import { EmailModule } from '../email/email.module';
import { UsageService } from './services/usage.service';
import { LimitsService } from './services/limits.service';
import { BillingService } from './services/billing.service';
import { PaymentMethodsService } from './services/payment-methods.service';
import { ProrationService } from './services/proration.service';
import { WebhookService } from './services/webhook.service';
import { WebhookHandlerService } from './services/webhook-handler.service';
import { SubscriptionRestrictionService } from './services/subscription-restriction.service';
import { SubscriptionGuard } from './guards/subscription.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { PaymentMethodsController } from './controllers/payment-methods.controller';
import { WebhookController } from './controllers/webhook.controller';
import { SubscriptionsService } from './subscriptions.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionPlan,
      UsageRecord,
      PaymentMethod,
      WebhookEvent,
      User,
      Tenant,
      Location,
    ]),
    AuditModule,
    EmailModule,
  ],
  controllers: [
    SubscriptionsController,
    PaymentMethodsController,
    WebhookController,
  ],
  providers: [
    SubscriptionsService,
    UsageService,
    LimitsService,
    BillingService,
    PaymentMethodsService,
    ProrationService,
    WebhookService,
    WebhookHandlerService,
    SubscriptionRestrictionService,
    SubscriptionGuard,
  ],
  exports: [
    SubscriptionsService,
    UsageService,
    LimitsService,
    BillingService,
    PaymentMethodsService,
    ProrationService,
    SubscriptionRestrictionService,
    SubscriptionGuard,
  ],
})
export class SubscriptionsModule {}
