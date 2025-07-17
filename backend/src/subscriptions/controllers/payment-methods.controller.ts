import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { PaymentMethodsService } from '../services/payment-methods.service';
import { CreateSetupIntentResponseDto } from '../dto/create-setup-intent.dto';
import { AttachPaymentMethodDto } from '../dto/attach-payment-method.dto';
import { PaymentMethodResponseDto } from '../dto/payment-method-response.dto';
import {
  PaymentMethodType,
  CardBrand,
} from '../entities/payment-method.entity';
import { RateLimit } from '../decorators/rate-limit.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@ApiBearerAuth()
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post('setup-intent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @RateLimit({ points: 5, duration: 60 }) // 5 requests per minute
  @ApiOperation({
    summary: 'Create a Setup Intent for collecting payment method',
  })
  @ApiResponse({
    status: 201,
    description: 'Setup Intent created successfully',
    type: CreateSetupIntentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSetupIntent(
    @Request() req,
  ): Promise<CreateSetupIntentResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    return this.paymentMethodsService.createSetupIntent(tenantId);
  }

  @Get('methods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'List all payment methods for the tenant' })
  @ApiResponse({
    status: 200,
    description: 'Payment methods retrieved successfully',
    type: [PaymentMethodResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listPaymentMethods(
    @Request() req,
  ): Promise<PaymentMethodResponseDto[]> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    const methods =
      await this.paymentMethodsService.listPaymentMethods(tenantId);

    return methods.map((method) => this.mapToResponseDto(method));
  }

  @Post('methods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @RateLimit({ points: 10, duration: 60 }) // 10 requests per minute
  @ApiOperation({
    summary: 'Attach a payment method after successful SetupIntent',
  })
  @ApiResponse({
    status: 201,
    description: 'Payment method attached successfully',
    type: PaymentMethodResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async attachPaymentMethod(
    @Request() req,
    @Body() dto: AttachPaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    const method = await this.paymentMethodsService.attachPaymentMethod(
      tenantId,
      dto.payment_method_id,
    );

    return this.mapToResponseDto(method);
  }

  @Delete('methods/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a payment method' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  @ApiResponse({
    status: 204,
    description: 'Payment method removed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot remove default payment method',
  })
  async removePaymentMethod(
    @Request() req,
    @Param('id') id: string,
  ): Promise<void> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    await this.paymentMethodsService.removePaymentMethod(tenantId, id);
  }

  @Put('methods/:id/default')
  @Roles(UserRole.SUPER_ADMIN, UserRole.GARAGE_ADMIN)
  @ApiOperation({ summary: 'Set a payment method as default' })
  @ApiParam({ name: 'id', description: 'Payment method ID' })
  @ApiResponse({
    status: 200,
    description: 'Default payment method updated successfully',
    type: PaymentMethodResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment method not found' })
  async setDefaultPaymentMethod(
    @Request() req,
    @Param('id') id: string,
  ): Promise<PaymentMethodResponseDto> {
    const tenantId = req.user.tenant?.id || req.tenantId;
    if (!tenantId) {
      throw new NotFoundException('Tenant not found');
    }
    const method = await this.paymentMethodsService.setDefaultPaymentMethod(
      tenantId,
      id,
    );

    return this.mapToResponseDto(method);
  }

  private mapToResponseDto(method: any): PaymentMethodResponseDto {
    const dto: PaymentMethodResponseDto = {
      id: method.id,
      type: method.type,
      is_default: method.is_default,
      created_at: method.created_at,
      display_string: this.getDisplayString(method),
    };

    // Add card fields
    if (method.type === PaymentMethodType.CARD) {
      dto.card_brand = method.card_brand;
      dto.card_last4 = method.card_last4;
      dto.card_exp_month = method.card_exp_month;
      dto.card_exp_year = method.card_exp_year;
    }

    // Add bank fields
    if (method.type === PaymentMethodType.SEPA_DEBIT) {
      dto.bank_name = method.bank_name;
      dto.bank_last4 = method.bank_last4;
    }

    // Add billing details
    dto.billing_name = method.billing_name;
    dto.billing_email = method.billing_email;

    return dto;
  }

  private getDisplayString(method: any): string {
    if (method.type === PaymentMethodType.CARD) {
      const brand = this.formatCardBrand(method.card_brand);
      return `${brand} •••• ${method.card_last4}`;
    }

    if (method.type === PaymentMethodType.SEPA_DEBIT) {
      return `${method.bank_name || 'Bank'} •••• ${method.bank_last4}`;
    }

    return method.type;
  }

  private formatCardBrand(brand: CardBrand): string {
    const brandMap = {
      [CardBrand.VISA]: 'Visa',
      [CardBrand.MASTERCARD]: 'Mastercard',
      [CardBrand.AMEX]: 'American Express',
      [CardBrand.DISCOVER]: 'Discover',
      [CardBrand.DINERS]: 'Diners Club',
      [CardBrand.JCB]: 'JCB',
      [CardBrand.UNIONPAY]: 'UnionPay',
      [CardBrand.UNKNOWN]: 'Card',
    };

    return brandMap[brand] || 'Card';
  }
}
