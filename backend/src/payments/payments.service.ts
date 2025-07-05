import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentTransaction, TransactionType, TransactionStatus } from './entities/payment-transaction.entity';
import { MollieProvider } from './providers/mollie/mollie.provider';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    private mollieProvider: MollieProvider,
    private auditService: AuditService,
  ) {}

  async createPaymentMethod(
    tenantId: string,
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    this.logger.log(`Creating payment method for tenant ${tenantId}`);

    try {
      // Create customer in Mollie if needed
      const customerId = await this.mollieProvider.createCustomer(
        `tenant-${tenantId}@wasplanning.nl`,
        { tenantId },
      );

      // Create payment method in Mollie
      const molliePaymentMethod = await this.mollieProvider.createPaymentMethod({
        customerId,
        type: dto.type,
        details: dto.details,
      });

      // If this is set as default, unset other defaults
      if (dto.isDefault) {
        await this.paymentMethodRepository.update(
          { tenantId },
          { isDefault: false },
        );
      }

      // Save payment method locally
      const paymentMethod = this.paymentMethodRepository.create({
        tenantId,
        provider: 'mollie',
        providerMethodId: molliePaymentMethod.providerId,
        type: dto.type,
        isDefault: dto.isDefault || false,
        metadata: {
          ...dto.metadata,
          customerId,
          details: molliePaymentMethod.details,
        },
      });

      const savedPaymentMethod = await this.paymentMethodRepository.save(paymentMethod);

      // Audit log payment method creation
      await this.auditService.logAction({
        action: 'PAYMENT_METHOD_CREATED',
        resource_type: 'PaymentMethod',
        resource_id: savedPaymentMethod.id,
        details: {
          type: dto.type,
          isDefault: dto.isDefault,
          provider: 'mollie',
        },
        tenant_id: tenantId,
      });

      return savedPaymentMethod;
    } catch (error) {
      this.logger.error(`Failed to create payment method: ${error.message}`);
      throw new BadRequestException('Failed to create payment method');
    }
  }

  async getPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.find({
      where: { tenantId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async deletePaymentMethod(tenantId: string, methodId: string): Promise<void> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: methodId, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    try {
      // Delete from Mollie
      await this.mollieProvider.deletePaymentMethod(paymentMethod.providerMethodId);

      // Delete locally
      await this.paymentMethodRepository.remove(paymentMethod);

      // Audit log payment method deletion
      await this.auditService.logAction({
        action: 'PAYMENT_METHOD_DELETED',
        resource_type: 'PaymentMethod',
        resource_id: methodId,
        details: {
          type: paymentMethod.type,
          provider: paymentMethod.provider,
        },
        tenant_id: tenantId,
      });
    } catch (error) {
      this.logger.error(`Failed to delete payment method: ${error.message}`);
      throw new BadRequestException('Failed to delete payment method');
    }
  }

  async setDefaultPaymentMethod(tenantId: string, methodId: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: methodId, tenantId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    // Unset all other defaults
    await this.paymentMethodRepository.update(
      { tenantId },
      { isDefault: false },
    );

    // Set this one as default
    paymentMethod.isDefault = true;
    return await this.paymentMethodRepository.save(paymentMethod);
  }

  async processPayment(
    tenantId: string,
    dto: ProcessPaymentDto,
  ): Promise<PaymentTransaction> {
    this.logger.log(`Processing payment for tenant ${tenantId}: ${dto.amount} ${dto.currency}`);

    try {
      // Get payment method if specified
      let paymentMethod: PaymentMethod | null = null;
      if (dto.paymentMethodId) {
        paymentMethod = await this.paymentMethodRepository.findOne({
          where: { id: dto.paymentMethodId, tenantId },
        });
        if (!paymentMethod) {
          throw new NotFoundException('Payment method not found');
        }
      } else {
        // Use default payment method
        paymentMethod = await this.paymentMethodRepository.findOne({
          where: { tenantId, isDefault: true },
        });
        if (!paymentMethod) {
          throw new BadRequestException('No payment method available');
        }
      }

      // Create transaction record
      const transaction = this.transactionRepository.create({
        tenantId,
        provider: 'mollie',
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        metadata: {
          ...dto.metadata,
          paymentMethodId: paymentMethod.id,
        },
      });

      const savedTransaction = await this.transactionRepository.save(transaction);

      // Process payment with Mollie
      const molliePayment = await this.mollieProvider.createPayment({
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        customerId: paymentMethod.metadata.customerId,
        paymentMethodId: paymentMethod.providerMethodId,
        metadata: {
          transactionId: savedTransaction.id,
          tenantId,
        },
      });

      // Update transaction with provider ID
      savedTransaction.providerTransactionId = molliePayment.providerId;
      savedTransaction.status = molliePayment.status === 'paid' 
        ? TransactionStatus.COMPLETED 
        : TransactionStatus.PENDING;

      const finalTransaction = await this.transactionRepository.save(savedTransaction);

      // Audit log payment processing
      await this.auditService.logAction({
        action: 'PAYMENT_PROCESSED',
        resource_type: 'PaymentTransaction',
        resource_id: finalTransaction.id,
        details: {
          amount: dto.amount,
          currency: dto.currency,
          status: finalTransaction.status,
          provider: 'mollie',
          providerTransactionId: molliePayment.providerId,
        },
        tenant_id: tenantId,
      });

      return finalTransaction;
    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`);
      throw new BadRequestException('Failed to process payment');
    }
  }

  async getTransactions(tenantId: string): Promise<PaymentTransaction[]> {
    return await this.transactionRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTransaction(tenantId: string, transactionId: string): Promise<PaymentTransaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId, tenantId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async updateTransactionStatus(
    providerTransactionId: string,
    status: TransactionStatus,
  ): Promise<void> {
    await this.transactionRepository.update(
      { providerTransactionId },
      { status },
    );
  }
}