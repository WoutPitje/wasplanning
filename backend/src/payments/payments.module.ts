import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { WebhookController } from './webhooks/webhook.controller';
import { MollieProvider } from './providers/mollie/mollie.provider';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentMethod, PaymentTransaction]),
    ConfigModule,
    AuditModule,
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, MollieProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}