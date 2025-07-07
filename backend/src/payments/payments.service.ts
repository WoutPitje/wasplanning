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
        undefined, // name
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
    const result = await this.transactionRepository.update(
      { providerTransactionId },
      { status },
    );

    if (result.affected === 0) {
      this.logger.warn(`No transaction found with providerTransactionId: ${providerTransactionId}`);
    } else {
      this.logger.log(`Updated transaction ${providerTransactionId} status to ${status}`);
    }
  }

  /**
   * Get or create a Mollie customer for a tenant
   */
  async getOrCreateCustomer(tenantId: string, customerData: { email: string; name?: string; metadata?: any }): Promise<{ id: string; isNew: boolean }> {
    this.logger.log(`Getting or creating Mollie customer for tenant ${tenantId}`);
    
    try {
      // Check if we already have a customer ID stored
      // First, check subscriptions for existing Mollie customer ID
      const subscriptionRepo = this.transactionRepository.manager.getRepository('Subscription');
      const existingSubscription = await subscriptionRepo.findOne({
        where: { tenantId },
        select: ['mollieCustomerId'],
      });
      
      if (existingSubscription?.mollieCustomerId) {
        this.logger.log(`Found existing Mollie customer: ${existingSubscription.mollieCustomerId}`);
        // Verify customer still exists in Mollie
        try {
          await this.mollieProvider.getCustomer(existingSubscription.mollieCustomerId);
          return { id: existingSubscription.mollieCustomerId, isNew: false };
        } catch (error) {
          this.logger.warn(`Mollie customer ${existingSubscription.mollieCustomerId} not found, creating new one`);
        }
      }
      
      // Create new customer
      const customerId = await this.mollieProvider.createCustomer(
        customerData.email, 
        customerData.name,
        {
          ...customerData.metadata,
          tenantId,
        }
      );
      
      this.logger.log(`Created new Mollie customer: ${customerId}`);
      return { id: customerId, isNew: true };
    } catch (error) {
      this.logger.error('Failed to get or create customer', error);
      throw new BadRequestException('Failed to setup payment customer');
    }
  }

  /**
   * Create a checkout payment (one-time payment or first payment for mandate)
   */
  async createCheckoutPayment(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    redirectUrl: string;
    webhookUrl?: string;
    metadata?: any;
    sequenceType?: 'first' | 'recurring' | 'oneoff';
  }): Promise<{ id: string; checkoutUrl: string; status: string }> {
    this.logger.log(`Creating checkout payment: ${params.amount} ${params.currency}`);
    
    // Validate tenantId before processing
    const tenantId = params.metadata?.tenantId;
    if (!tenantId) {
      this.logger.error('No tenantId found in payment metadata');
      throw new BadRequestException('Invalid payment metadata: missing tenantId');
    }
    
    try {
      // Create checkout payment with Mollie
      const payment = await this.mollieProvider.createCheckoutPayment({
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        customerId: params.customerId,
        redirectUrl: params.redirectUrl,
        webhookUrl: params.webhookUrl,
        metadata: params.metadata,
        sequenceType: params.sequenceType,
      });

      // Create a payment transaction record in the database
      const transaction = this.transactionRepository.create({
        tenantId,
        provider: 'mollie',
        providerTransactionId: payment.id,
        type: params.metadata?.type || TransactionType.SUBSCRIPTION,
        status: TransactionStatus.PENDING,
        amount: params.amount,
        currency: params.currency,
        description: params.description,
        metadata: params.metadata || {},
      });

      await this.transactionRepository.save(transaction);
      this.logger.log(`Created payment transaction ${transaction.id} for Mollie payment ${payment.id}`);

      // Audit log payment creation
      await this.auditService.logAction({
        action: 'PAYMENT_CREATED',
        resource_type: 'PaymentTransaction',
        resource_id: transaction.id,
        details: {
          amount: params.amount,
          currency: params.currency,
          status: TransactionStatus.PENDING,
          provider: 'mollie',
          providerTransactionId: payment.id,
          type: transaction.type,
          sequenceType: params.sequenceType,
        },
        tenant_id: tenantId,
      });

      return payment;
    } catch (error) {
      this.logger.error('Failed to create checkout payment', error);
      throw new BadRequestException('Failed to create payment');
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; metadata: any }> {
    this.logger.log(`Getting payment ${paymentId}`);
    
    try {
      const payment = await this.mollieProvider.getPayment(paymentId);
      return {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        metadata: payment.metadata || {},
      };
    } catch (error) {
      this.logger.error('Failed to get payment', error);
      throw new NotFoundException('Payment not found');
    }
  }

  /**
   * Get payment status from provider
   */
  async getPaymentStatus(paymentId: string): Promise<{ id: string; status: string; metadata?: any }> {
    this.logger.log(`Getting payment status for ${paymentId}`);
    
    try {
      const payment = await this.getPayment(paymentId);
      return {
        id: payment.id,
        status: payment.status,
        metadata: payment.metadata,
      };
    } catch (error) {
      this.logger.error('Failed to get payment status', error);
      throw new BadRequestException('Failed to get payment status');
    }
  }

  /**
   * Check if customer has valid mandates
   */
  async hasValidMandate(customerId: string): Promise<boolean> {
    try {
      const mandates = await this.mollieProvider.listMandates(customerId);
      return mandates.length > 0;
    } catch (error) {
      this.logger.error('Failed to check mandates', error);
      return false;
    }
  }

  /**
   * Create a Mollie subscription
   */
  async createSubscription(params: {
    customerId: string;
    amount: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    description: string;
    mandateId?: string;
    metadata?: any;
  }): Promise<{ id: string; status: string; nextPaymentDate: Date }> {
    this.logger.log(`Creating Mollie subscription for customer ${params.customerId}`);
    
    try {
      const subscription = await this.mollieProvider.createSubscription({
        customerId: params.customerId,
        amount: params.amount,
        currency: params.currency,
        interval: params.interval,
        description: params.description,
        mandateId: params.mandateId,
        metadata: params.metadata,
      });
      
      return {
        id: subscription.id,
        status: subscription.status,
        nextPaymentDate: subscription.nextPaymentDate,
      };
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw new BadRequestException(error.message || 'Failed to create subscription');
    }
  }

  /**
   * Cancel a Mollie subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    this.logger.log(`Canceling Mollie subscription ${subscriptionId}`);
    
    try {
      await this.mollieProvider.cancelSubscription(subscriptionId);
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new BadRequestException('Failed to cancel subscription');
    }
  }

  /**
   * Get Mollie subscription details
   */
  async getSubscription(subscriptionId: string, customerId?: string): Promise<any> {
    try {
      return await this.mollieProvider.getSubscription(subscriptionId, customerId);
    } catch (error) {
      this.logger.error('Failed to get subscription', error);
      throw new BadRequestException('Failed to get subscription');
    }
  }
}