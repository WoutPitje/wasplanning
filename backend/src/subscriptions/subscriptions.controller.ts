import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { PlanResponseDto } from './dto/plan-response.dto';
import { UsageResponseDto } from './dto/usage-response.dto';
import {
  UpgradeSubscriptionDto,
  UpgradeSubscriptionResponseDto,
} from './dto/upgrade-subscription.dto';
import { RateLimit } from './decorators/rate-limit.decorator';
import { InvoicesResponseDto } from './dto/invoice-response.dto';

@ApiTags('Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({
    summary: 'Get current subscription',
    description:
      'Returns the current active subscription with usage statistics and features',
  })
  @ApiResponse({
    status: 200,
    description: 'Current subscription details',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async getCurrentSubscription(
    @Request() req: any,
  ): Promise<SubscriptionResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.getCurrentSubscription(tenantId);
  }

  @Get('plans')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({
    summary: 'Get available subscription plans',
    description:
      'Returns all available subscription plans with features and pricing',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available plans',
    type: [PlanResponseDto],
  })
  async getAvailablePlans(@Request() req: any): Promise<PlanResponseDto[]> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.getAvailablePlans(tenantId);
  }

  @Get('usage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  @ApiOperation({
    summary: 'Get detailed usage breakdown',
    description:
      'Returns detailed usage statistics for the current billing period',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed usage breakdown',
    type: UsageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async getDetailedUsage(@Request() req: any): Promise<UsageResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.getDetailedUsage(tenantId);
  }

  @Get('limits')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN, UserRole.WASPLANNERS)
  @ApiOperation({
    summary: 'Get current limits and remaining quota',
    description:
      'Returns current subscription limits, remaining quota, and what actions can be performed',
  })
  @ApiResponse({
    status: 200,
    description: 'Current limits and quota',
    schema: {
      type: 'object',
      properties: {
        limits: {
          type: 'object',
          properties: {
            cars_per_month: { type: 'number', nullable: true, example: 1500 },
            active_users: { type: 'number', nullable: true, example: 10 },
            locations: { type: 'number', nullable: true, example: 3 },
          },
        },
        remaining_quota: {
          type: 'object',
          properties: {
            cars_per_month: { type: 'number', nullable: true, example: 750 },
            active_users: { type: 'number', nullable: true, example: 5 },
            locations: { type: 'number', nullable: true, example: 2 },
          },
        },
        can_perform: {
          type: 'object',
          properties: {
            wash_car: { type: 'boolean', example: true },
            create_user: { type: 'boolean', example: true },
            create_location: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async getCurrentLimits(@Request() req: any) {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.getCurrentLimits(tenantId);
  }

  @Post('upgrade')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @RateLimit({ points: 5, duration: 300 }) // 5 requests per 5 minutes
  @ApiOperation({
    summary: 'Upgrade or downgrade subscription to a new plan',
    description:
      'Changes the current subscription to a new plan. Handles payment, proration, and 3D Secure authentication if required. For downgrades to free plan, set immediate=false to schedule for end of billing period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription upgraded successfully',
    type: UpgradeSubscriptionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid plan, payment method, or insufficient funds',
  })
  @ApiResponse({
    status: 402,
    description: 'Payment required - No payment method on file',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission to upgrade',
  })
  async upgradeSubscription(
    @Request() req: any,
    @Body() dto: UpgradeSubscriptionDto,
  ): Promise<UpgradeSubscriptionResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.upgradeSubscription(
      tenantId,
      dto.plan_id,
      dto.payment_method_id,
      dto.immediate ?? true,
    );
  }

  @Post('cancel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @RateLimit({ points: 5, duration: 300 }) // 5 requests per 5 minutes
  @ApiOperation({
    summary: 'Cancel subscription at end of billing period',
    description:
      'Cancels the subscription but keeps it active until the end of the current billing period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Subscription will be cancelled at the end of the billing period',
        },
        cancel_at: {
          type: 'string',
          format: 'date-time',
          example: '2024-02-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async cancelSubscription(@Request() req: any) {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.cancelSubscription(tenantId);
  }

  @Post('reactivate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @RateLimit({ points: 5, duration: 300 }) // 5 requests per 5 minutes
  @ApiOperation({
    summary: 'Reactivate a subscription scheduled for cancellation',
    description:
      'Removes the scheduled cancellation and keeps the subscription active.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription reactivated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Subscription reactivated successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No subscription scheduled for cancellation found',
  })
  @ApiResponse({
    status: 400,
    description: 'Subscription is not scheduled for cancellation',
  })
  async reactivateSubscription(@Request() req: any) {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.reactivateSubscription(tenantId);
  }

  @Get('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({
    summary: 'Get subscription invoices',
    description:
      'Fetches a paginated list of invoices from Stripe for the current tenant.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of invoices to retrieve (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'starting_after',
    required: false,
    type: String,
    description: 'Pagination cursor for next page',
    example: 'in_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices',
    type: InvoicesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No active subscription found',
  })
  async getInvoices(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('starting_after') starting_after?: string,
  ): Promise<InvoicesResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.subscriptionsService.getInvoices(
      tenantId,
      limit,
      starting_after,
    );
  }
}
