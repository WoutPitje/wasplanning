import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditQueryDto } from './dto/audit-query.dto';

export interface AuditLogData {
  tenant_id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(data: AuditLogData): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create(data);
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log error but don't throw - audit logging should not break the application
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create audit log: ${errorMessage}`,
        errorStack,
      );
    }
  }

  async getAuditLogs(query: AuditQueryDto, tenantId: string | null) {
    const {
      page = 1,
      limit = 20,
      user_id,
      action,
      resource_type,
      start_date,
      end_date,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user');
    
    // Only filter by tenant if tenantId is provided (for non-super admins)
    if (tenantId) {
      queryBuilder.where('audit_log.tenant_id = :tenantId', { tenantId });
    }

    if (user_id) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId: user_id });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (resource_type) {
      queryBuilder.andWhere('audit_log.resource_type = :resourceType', {
        resourceType: resource_type,
      });
    }

    if (start_date) {
      queryBuilder.andWhere('audit_log.created_at >= :startDate', {
        startDate: start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('audit_log.created_at <= :endDate', {
        endDate: end_date,
      });
    }

    // Apply sorting
    const validSortFields = ['created_at', 'action', 'resource_type'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    queryBuilder.orderBy(
      `audit_log.${sortField}`,
      order.toUpperCase() as 'ASC' | 'DESC',
    );

    // Calculate pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getUserActivity(userId: string, tenantId: string | null, limit = 10) {
    const where: any = { user_id: userId };
    if (tenantId) {
      where.tenant_id = tenantId;
    }
    
    return this.auditLogRepository.find({
      where,
      order: {
        created_at: 'DESC',
      },
      take: limit,
    });
  }

  async getAuditStats(tenantId: string | null, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.action', 'action')
      .addSelect('COUNT(*)', 'count');
    
    if (tenantId) {
      queryBuilder.where('audit_log.tenant_id = :tenantId', { tenantId });
    }
    
    const stats = await queryBuilder
      .andWhere('audit_log.created_at >= :startDate', { startDate })
      .groupBy('audit_log.action')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return stats;
  }

  async exportAuditLogsAsCsv(query: AuditQueryDto, tenantId: string | null): Promise<Buffer> {
    const {
      user_id,
      action,
      resource_type,
      start_date,
      end_date,
    } = query;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user');
    
    // Only filter by tenant if tenantId is provided (for non-super admins)
    if (tenantId) {
      queryBuilder.where('audit_log.tenant_id = :tenantId', { tenantId });
    }

    if (user_id) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId: user_id });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (resource_type) {
      queryBuilder.andWhere('audit_log.resource_type = :resourceType', {
        resourceType: resource_type,
      });
    }

    if (start_date) {
      queryBuilder.andWhere('audit_log.created_at >= :startDate', {
        startDate: start_date,
      });
    }

    if (end_date) {
      queryBuilder.andWhere('audit_log.created_at <= :endDate', {
        endDate: end_date,
      });
    }

    queryBuilder.orderBy('audit_log.created_at', 'DESC');

    const logs = await queryBuilder.getMany();

    // Create CSV content
    const csvHeaders = [
      'Date',
      'Time',
      'User',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Details',
    ];

    const csvRows = logs.map(log => {
      const date = new Date(log.created_at);
      return [
        date.toLocaleDateString('en-US'),
        date.toLocaleTimeString('en-US'),
        log.user?.email || 'System',
        log.action,
        log.resource_type,
        log.resource_id || '',
        log.ip_address || '',
        log.details ? JSON.stringify(log.details) : '',
      ];
    });

    // Build CSV string
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma or quotes
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        }).join(',')
      ),
    ].join('\n');

    return Buffer.from(csvContent, 'utf-8');
  }
}
