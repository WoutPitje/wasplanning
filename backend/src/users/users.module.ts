import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../auth/entities/user.entity';
import { Tenant } from '../auth/entities/tenant.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Tenant]),
    AuthModule, // For AuthService (password hashing)
    AuditModule,
    EmailModule, // For EmailService (sending welcome emails)
    SubscriptionsModule, // For LimitsService
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
