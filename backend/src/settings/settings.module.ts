import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { AdminModule } from '../admin/admin.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AdminModule, SubscriptionsModule, AuditModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
