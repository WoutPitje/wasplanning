import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';
import { UsageService } from './services/usage.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RecordUsageDto } from './dto/record-usage.dto';
import { SubscriptionQueryDto } from './dto/subscription-query.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly usageService: UsageService,
  ) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'Plans retrieved successfully' })
  async getPlans() {
    return await this.subscriptionsService.getAvailablePlans();
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get a specific subscription plan' })
  @ApiResponse({ status: 200, description: 'Plan retrieved successfully' })
  async getPlan(@Param('id') id: string) {
    return await this.subscriptionsService.getPlan(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async createSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return await this.subscriptionsService.createSubscription(req.user.tenant.id, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current subscription for tenant' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved successfully' })
  async getCurrentSubscription(@Request() req: any) {
    return await this.subscriptionsService.getCurrentSubscription(req.user.tenant.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  async updateSubscription(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return await this.subscriptionsService.updateSubscription(req.user.tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription canceled successfully' })
  async cancelSubscription(
    @Request() req: any,
    @Param('id') id: string,
    @Query('immediately') immediately?: boolean,
  ) {
    return await this.subscriptionsService.cancelSubscription(
      req.user.tenant.id,
      id,
      immediately === true,
    );
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a canceled subscription' })
  @ApiResponse({ status: 200, description: 'Subscription reactivated successfully' })
  async reactivateSubscription(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return await this.subscriptionsService.reactivateSubscription(req.user.tenant.id, id);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Record usage manually' })
  @ApiResponse({ status: 201, description: 'Usage recorded successfully' })
  async recordUsage(
    @Request() req: any,
    @Body() dto: RecordUsageDto,
  ) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(req.user.tenant.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    return await this.usageService.recordUsage(subscription.id, dto);
  }

  @Get('usage/current-period')
  @ApiOperation({ summary: 'Get current billing period usage' })
  @ApiResponse({ status: 200, description: 'Usage data retrieved successfully' })
  async getCurrentPeriodUsage(@Request() req: any) {
    return await this.subscriptionsService.getCurrentUsage(req.user.tenant.id);
  }

  @Get('usage/history')
  @ApiOperation({ summary: 'Get usage history' })
  @ApiResponse({ status: 200, description: 'Usage history retrieved successfully' })
  async getUsageHistory(
    @Request() req: any,
    @Query() query: SubscriptionQueryDto,
  ) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(req.user.tenant.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    return await this.usageService.getUsageHistory(subscription.id, startDate, endDate);
  }

  @Get('billing/upcoming')
  @ApiOperation({ summary: 'Get upcoming billing information' })
  @ApiResponse({ status: 200, description: 'Upcoming billing info retrieved successfully' })
  async getUpcomingBilling(@Request() req: any) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(req.user.tenant.id);
    if (!subscription) {
      throw new Error('No active subscription found');
    }

    // TODO: Calculate upcoming bill based on usage and plan
    return {
      subscription: {
        id: subscription.id,
        currentPeriodEnd: subscription.currentPeriodEnd,
        billingInterval: subscription.billingInterval,
      },
      estimatedAmount: subscription.plan.priceMonthly, // Simplified for now
      nextBillingDate: subscription.currentPeriodEnd,
    };
  }
}