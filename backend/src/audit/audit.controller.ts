import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Param,
  ParseUUIDPipe,
  Response,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditQueryDto } from './dto/audit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@ApiTags('Audit Logs')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of audit logs',
  })
  async getAuditLogs(@Query() query: AuditQueryDto, @Request() req: any) {
    // Super admin can view all logs, garage admin only their tenant
    const tenantId = req.user.tenant?.id || null;
    return this.auditService.getAuditLogs(query, tenantId);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Get audit log statistics' })
  @ApiResponse({
    status: 200,
    description: 'Audit log statistics for the last 7 days',
  })
  async getAuditStats(@Request() req: any) {
    const tenantId = req.user.tenant?.id || null;
    return this.auditService.getAuditStats(tenantId);
  }

  @Get('users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Get user activity' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Recent activity for a specific user',
  })
  async getUserActivity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: any,
  ) {
    const tenantId = req.user.tenant?.id || null;
    return this.auditService.getUserActivity(userId, tenantId);
  }

  @Get('export')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Export audit logs as CSV' })
  @ApiProduces('text/csv')
  @ApiResponse({
    status: 200,
    description: 'CSV file with audit logs',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportAuditLogs(
    @Query() query: AuditQueryDto,
    @Request() req: any,
    @Response({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const tenantId = req.user.tenant?.id || null;
    const csvBuffer = await this.auditService.exportAuditLogsAsCsv(query, tenantId);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
    });
    
    return new StreamableFile(csvBuffer);
  }
}
