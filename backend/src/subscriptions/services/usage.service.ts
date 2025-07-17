import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageRecord, UsageType } from '../entities/usage-record.entity';
import { Subscription } from '../entities/subscription.entity';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageRecord)
    private usageRecordRepository: Repository<UsageRecord>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  /**
   * Increment the car count for a tenant
   * Uses database transaction for atomic increments
   */
  async incrementCarCount(tenantId: string): Promise<void> {
    const currentPeriod = await this.getCurrentPeriod(tenantId);

    // Use raw query for atomic increment
    await this.usageRecordRepository.query(
      `
      INSERT INTO usage_records (tenant_id, record_type, period_start, period_end, count)
      VALUES ($1, $2, $3, $4, 1)
      ON CONFLICT (tenant_id, record_type, period_start)
      DO UPDATE SET count = usage_records.count + 1, updated_at = NOW()
      `,
      [tenantId, UsageType.CARS_WASHED, currentPeriod.start, currentPeriod.end],
    );
  }

  /**
   * Track an active user for the current month
   * For simplicity, we'll track this separately with a different table later
   * For now, we'll increment a counter (not ideal for unique users)
   */
  async trackActiveUser(tenantId: string, userId: string): Promise<void> {
    // TODO: Implement proper unique user tracking with a separate table
    // For MVP, we'll just track login count
    const currentPeriod = await this.getCurrentPeriod(tenantId);

    // Check if user was already tracked this month
    const tracked = await this.usageRecordRepository
      .query(
        `
      SELECT 1 FROM user_activity_tracking 
      WHERE tenant_id = $1 AND user_id = $2 AND period_start = $3
      LIMIT 1
      `,
        [tenantId, userId, currentPeriod.start],
      )
      .catch(() => []); // Table doesn't exist yet

    if (tracked.length === 0) {
      // Update the count
      await this.usageRecordRepository.query(
        `
        INSERT INTO usage_records (tenant_id, record_type, period_start, period_end, count)
        VALUES ($1, $2, $3, $4, 1)
        ON CONFLICT (tenant_id, record_type, period_start)
        DO UPDATE SET count = usage_records.count + 1, updated_at = NOW()
        `,
        [
          tenantId,
          UsageType.ACTIVE_USERS,
          currentPeriod.start,
          currentPeriod.end,
        ],
      );
    }
  }

  /**
   * Get monthly usage for a specific type
   */
  async getMonthlyUsage(tenantId: string, type: UsageType): Promise<number> {
    const currentPeriod = await this.getCurrentPeriod(tenantId);

    const record = await this.usageRecordRepository.findOne({
      where: {
        tenant_id: tenantId,
        record_type: type,
        period_start: currentPeriod.start,
      },
    });

    return record?.count || 0;
  }

  /**
   * Initialize monthly records for a tenant
   * Called when tenant is created or at start of new month
   */
  async initializeMonthlyRecords(tenantId: string): Promise<void> {
    const currentPeriod = await this.getCurrentPeriod(tenantId);

    // Create records for both usage types
    for (const type of Object.values(UsageType)) {
      const existing = await this.usageRecordRepository.findOne({
        where: {
          tenant_id: tenantId,
          record_type: type,
          period_start: currentPeriod.start,
        },
      });

      if (!existing) {
        await this.usageRecordRepository.save({
          tenant_id: tenantId,
          record_type: type,
          period_start: currentPeriod.start,
          period_end: currentPeriod.end,
          count: 0,
        });
      }
    }
  }

  /**
   * Get current billing period for a tenant
   */
  private async getCurrentPeriod(
    tenantId: string,
  ): Promise<{ start: Date; end: Date }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant_id: tenantId },
    });

    if (!subscription) {
      // Default to calendar month if no subscription
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start, end };
    }

    return {
      start: new Date(subscription.current_period_start),
      end: new Date(subscription.current_period_end),
    };
  }

  /**
   * Reset usage for a new billing period
   */
  async resetMonthlyUsage(tenantId: string): Promise<void> {
    const currentPeriod = await this.getCurrentPeriod(tenantId);

    // Create new records for the new period
    await this.initializeMonthlyRecords(tenantId);
  }

  /**
   * Get usage statistics for a tenant
   */
  async getUsageStats(tenantId: string): Promise<{
    cars_washed: number;
    active_users: number;
    period_start: Date;
    period_end: Date;
  }> {
    const currentPeriod = await this.getCurrentPeriod(tenantId);
    const carsWashed = await this.getMonthlyUsage(
      tenantId,
      UsageType.CARS_WASHED,
    );
    const activeUsers = await this.getMonthlyUsage(
      tenantId,
      UsageType.ACTIVE_USERS,
    );

    return {
      cars_washed: carsWashed,
      active_users: activeUsers,
      period_start: currentPeriod.start,
      period_end: currentPeriod.end,
    };
  }
}
