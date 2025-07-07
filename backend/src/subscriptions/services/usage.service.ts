import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageRecord, MetricType } from '../entities/usage-record.entity';
import { Subscription } from '../entities/subscription.entity';
import { RecordUsageDto } from '../dto/record-usage.dto';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(
    @InjectRepository(UsageRecord)
    private usageRepository: Repository<UsageRecord>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    private auditService: AuditService,
  ) {}

  async recordUsage(
    subscriptionId: string,
    dto: RecordUsageDto,
  ): Promise<UsageRecord> {
    this.logger.log(`Recording usage for subscription ${subscriptionId}: ${dto.metricType} = ${dto.quantity}`);

    const usage = this.usageRepository.create({
      subscriptionId,
      metricType: dto.metricType,
      quantity: dto.quantity,
      metadata: dto.metadata || {},
    });

    const savedUsage = await this.usageRepository.save(usage);

    // Get subscription to get tenant ID for audit log
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['tenant'],
    });

    // Audit log usage recording (only for significant events like car washes)
    if (dto.metricType === MetricType.CARS_WASHED) {
      await this.auditService.logAction({
        action: 'USAGE_RECORDED',
        resource_type: 'UsageRecord',
        resource_id: savedUsage.id,
        details: {
          metricType: dto.metricType,
          quantity: dto.quantity,
          subscriptionId,
          metadata: dto.metadata,
        },
        tenant_id: subscription?.tenantId,
      });
    }

    return savedUsage;
  }

  async getCurrentPeriodUsage(
    subscriptionId: string,
    metricType?: MetricType,
  ): Promise<{ [key: string]: number }> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${subscriptionId} not found`);
    }

    const whereClause: any = {
      subscriptionId,
      recordedAt: Between(subscription.currentPeriodStart, subscription.currentPeriodEnd),
    };

    if (metricType) {
      whereClause.metricType = metricType;
    }

    const usageRecords = await this.usageRepository.find({
      where: whereClause,
    });

    // Aggregate usage by metric type
    const usage: { [key: string]: number } = {};
    for (const record of usageRecords) {
      const metric = record.metricType;
      usage[metric] = (usage[metric] || 0) + record.quantity;
    }

    return usage;
  }

  async getUsageHistory(
    subscriptionId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<UsageRecord[]> {
    const whereClause: any = { subscriptionId };

    if (startDate && endDate) {
      whereClause.recordedAt = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.recordedAt = { $gte: startDate };
    } else if (endDate) {
      whereClause.recordedAt = { $lte: endDate };
    }

    return await this.usageRepository.find({
      where: whereClause,
      order: { recordedAt: 'DESC' },
    });
  }

  async getUsageSummary(
    subscriptionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ [key: string]: number }> {
    const usageRecords = await this.usageRepository.find({
      where: {
        subscriptionId,
        recordedAt: Between(startDate, endDate),
      },
    });

    const summary: { [key: string]: number } = {};
    for (const record of usageRecords) {
      const metric = record.metricType;
      summary[metric] = (summary[metric] || 0) + record.quantity;
    }

    return summary;
  }

  async getDailyUsage(
    subscriptionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ date: string; [key: string]: any }[]> {
    // This would typically use a more sophisticated query
    // For now, we'll do basic aggregation
    const usageRecords = await this.usageRepository.find({
      where: {
        subscriptionId,
        recordedAt: Between(startDate, endDate),
      },
      order: { recordedAt: 'ASC' },
    });

    const dailyUsage: { [date: string]: { [metric: string]: number } } = {};

    for (const record of usageRecords) {
      const date = record.recordedAt.toISOString().split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = {};
      }
      const metric = record.metricType;
      dailyUsage[date][metric] = (dailyUsage[date][metric] || 0) + record.quantity;
    }

    return Object.entries(dailyUsage).map(([date, metrics]) => ({
      date,
      ...metrics,
    }));
  }

  // Helper methods for specific metrics
  async recordCarWash(subscriptionId: string, metadata?: Record<string, any>): Promise<UsageRecord> {
    return this.recordUsage(subscriptionId, {
      metricType: MetricType.CARS_WASHED,
      quantity: 1,
      metadata,
    });
  }

  async recordActiveUser(subscriptionId: string, userId: string): Promise<UsageRecord> {
    // Check if user was already recorded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRecord = await this.usageRepository.findOne({
      where: {
        subscriptionId,
        metricType: MetricType.ACTIVE_USERS,
        recordedAt: Between(today, tomorrow),
        metadata: { userId } as any,
      },
    });

    if (existingRecord) {
      return existingRecord;
    }

    return this.recordUsage(subscriptionId, {
      metricType: MetricType.ACTIVE_USERS,
      quantity: 1,
      metadata: { userId },
    });
  }

  async recordActiveLocation(subscriptionId: string, locationId: string): Promise<UsageRecord> {
    // Check if location was already recorded today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingRecord = await this.usageRepository.findOne({
      where: {
        subscriptionId,
        metricType: MetricType.ACTIVE_LOCATIONS,
        recordedAt: Between(today, tomorrow),
        metadata: { locationId } as any,
      },
    });

    if (existingRecord) {
      return existingRecord;
    }

    return this.recordUsage(subscriptionId, {
      metricType: MetricType.ACTIVE_LOCATIONS,
      quantity: 1,
      metadata: { locationId },
    });
  }
}