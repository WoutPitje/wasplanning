import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('methods')
  @ApiOperation({ summary: 'Create a new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method created successfully' })
  async createPaymentMethod(
    @Request() req: any,
    @Body() dto: CreatePaymentMethodDto,
  ) {
    return await this.paymentsService.createPaymentMethod(req.user.tenant.id, dto);
  }

  @Get('methods')
  @ApiOperation({ summary: 'Get all payment methods for tenant' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods(@Request() req: any) {
    return await this.paymentsService.getPaymentMethods(req.user.tenant.id);
  }

  @Delete('methods/:id')
  @ApiOperation({ summary: 'Delete a payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted successfully' })
  async deletePaymentMethod(@Request() req: any, @Param('id') id: string) {
    await this.paymentsService.deletePaymentMethod(req.user.tenant.id, id);
    return { message: 'Payment method deleted successfully' };
  }

  @Patch('methods/:id/set-default')
  @ApiOperation({ summary: 'Set payment method as default' })
  @ApiResponse({ status: 200, description: 'Default payment method updated' })
  async setDefaultPaymentMethod(@Request() req: any, @Param('id') id: string) {
    return await this.paymentsService.setDefaultPaymentMethod(req.user.tenant.id, id);
  }

  @Post('charge')
  @ApiOperation({ summary: 'Process a one-time payment' })
  @ApiResponse({ status: 201, description: 'Payment processed successfully' })
  async processPayment(
    @Request() req: any,
    @Body() dto: ProcessPaymentDto,
  ) {
    return await this.paymentsService.processPayment(req.user.tenant.id, dto);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get all transactions for tenant' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(@Request() req: any) {
    return await this.paymentsService.getTransactions(req.user.tenant.id);
  }

  @Get('transactions/:id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  async getTransaction(@Request() req: any, @Param('id') id: string) {
    return await this.paymentsService.getTransaction(req.user.tenant.id, id);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get payment status from provider' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Param('id') id: string) {
    return await this.paymentsService.getPaymentStatus(id);
  }
}