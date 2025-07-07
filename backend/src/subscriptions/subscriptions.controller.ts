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
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { SubscriptionsService as SubService } from './subscriptions.service';
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
  @ApiOperation({ summary: 'Create a new subscription (trial)' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  async createSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return await this.subscriptionsService.createSubscription(req.user.tenant.id, dto);
  }

  @Post('paid')
  @ApiOperation({ summary: 'Create a paid subscription with Mollie checkout' })
  @ApiResponse({ status: 201, description: 'Checkout URL created successfully' })
  async createPaidSubscription(
    @Request() req: any,
    @Body() dto: CreateSubscriptionDto & { returnUrl: string },
  ) {
    return await this.subscriptionsService.createPaidSubscription(req.user.tenant.id, dto);
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
      throw new NotFoundException('No active subscription found');
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
      throw new NotFoundException('No active subscription found');
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
      throw new NotFoundException('No active subscription found');
    }

    // Get current period usage
    const currentUsage = await this.usageService.getCurrentPeriodUsage(subscription.id);
    
    // Calculate base subscription amount
    const baseAmount = subscription.billingInterval === 'year' 
      ? parseFloat(subscription.plan.priceYearly.toString())
      : parseFloat(subscription.plan.priceMonthly.toString());
    
    // Calculate usage-based charges if any
    let usageCharges = 0;
    const usageDetails = [];
    
    // If the plan has usage-based pricing
    if (subscription.plan.billingType === 'hybrid' && subscription.plan.overagePricePerCar) {
      const carsWashed = currentUsage.cars_washed || 0;
      const planLimit = subscription.plan.maxCarsPerMonth || 0;
      const overage = Math.max(0, carsWashed - planLimit);
      
      if (overage > 0) {
        const perCarPrice = parseFloat(subscription.plan.overagePricePerCar.toString());
        usageCharges = overage * perCarPrice;
        usageDetails.push({
          type: 'cars_washed_overage',
          quantity: overage,
          unitPrice: perCarPrice,
          total: usageCharges
        });
      }
    }
    
    // Apply any credits
    const creditBalance = parseFloat(subscription.creditBalance?.toString() || '0');
    const totalBeforeCredits = baseAmount + usageCharges;
    const creditsApplied = Math.min(creditBalance, totalBeforeCredits);
    const estimatedAmount = Math.max(0, totalBeforeCredits - creditsApplied);

    return {
      subscription: {
        id: subscription.id,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        billingInterval: subscription.billingInterval,
        plan: subscription.plan.name,
      },
      billing: {
        baseAmount,
        usageCharges,
        usageDetails,
        totalBeforeCredits,
        creditBalance,
        creditsApplied,
        estimatedAmount,
      },
      currentUsage,
      nextBillingDate: subscription.currentPeriodEnd,
    };
  }

  @Post(':id/preview-plan-change')
  @ApiOperation({ summary: 'Preview plan change costs and credit usage' })
  @ApiResponse({ status: 200, description: 'Plan change preview calculated successfully' })
  async previewPlanChange(
    @Request() req: any,
    @Param('id') subscriptionId: string,
    @Body() body: { newPlanName: string; billingInterval?: string },
  ) {
    return await this.subscriptionsService.previewPlanChange(
      req.user.tenant.id,
      subscriptionId,
      body.newPlanName as any,
      body.billingInterval as any,
    );
  }

  @Post(':id/change-plan')
  @ApiOperation({ summary: 'Change subscription plan with payment' })
  @ApiResponse({ status: 200, description: 'Plan change initiated successfully' })
  async changeSubscriptionPlan(
    @Request() req: any,
    @Param('id') subscriptionId: string,
    @Body() body: { newPlanName: string; billingInterval?: string; returnUrl: string },
  ) {
    return await this.subscriptionsService.changeSubscriptionPlan(
      req.user.tenant.id,
      subscriptionId,
      body.newPlanName as any,
      body.returnUrl,
      body.billingInterval as any,
    );
  }

  @Post('complete-change/:paymentId')
  @ApiOperation({ summary: 'Complete subscription plan change after payment' })
  @ApiResponse({ status: 200, description: 'Plan change completed successfully' })
  async completeSubscriptionChange(@Param('paymentId') paymentId: string) {
    return await this.subscriptionsService.completeSubscriptionChange(paymentId);
  }

  @Get('pending-payment')
  @ApiOperation({ summary: 'Get pending payment for current subscription' })
  @ApiResponse({ status: 200, description: 'Pending payment info retrieved' })
  async getPendingPayment(@Request() req: any) {
    const subscription = await this.subscriptionsService.getCurrentSubscription(req.user.tenant.id);
    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }
    
    const pendingPaymentId = subscription.metadata?.pendingChangePaymentId || subscription.metadata?.pendingPaymentId;
    if (!pendingPaymentId) {
      return null;
    }
    
    return {
      paymentId: pendingPaymentId,
      action: subscription.metadata?.pendingChangePaymentId ? 'change' : 'new',
      planName: subscription.metadata?.pendingNewPlanName || subscription.plan?.name,
    };
  }

  @Get('credit-balance')
  @ApiOperation({ summary: 'Get credit balance and transaction history' })
  @ApiResponse({ status: 200, description: 'Credit information retrieved successfully' })
  async getCreditBalance(@Request() req: any) {
    return await this.subscriptionsService.getCreditBalance(req.user.tenant.id);
  }

  @Post('complete-new/:paymentId')
  @ApiOperation({ summary: 'Complete new subscription creation after payment' })
  @ApiResponse({ status: 200, description: 'Subscription created successfully' })
  async completeNewSubscription(@Param('paymentId') paymentId: string) {
    return await this.subscriptionsService.completeNewSubscription(paymentId);
  }

  @Post(':id/pay-overdue')
  @ApiOperation({ summary: 'Create payment for overdue subscription' })
  @ApiResponse({ status: 200, description: 'Payment checkout URL created successfully' })
  async payOverdueSubscription(
    @Request() req: any,
    @Param('id') subscriptionId: string,
  ) {
    return await this.subscriptionsService.payOverdueSubscription(
      req.user.tenant.id,
      subscriptionId,
    );
  }
}