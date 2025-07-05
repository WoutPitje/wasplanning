import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentTransaction, TransactionStatus } from './entities/payment-transaction.entity';
import { MollieProvider } from './providers/mollie/mollie.provider';
import { AuditService } from '../audit/audit.service';

import {
  mockMollieProvider,
  mockMollieCustomer,
  mockMolliePayment,
  mockMolliePaymentMethod,
} from './test/mocks/mollie.mock';
import {
  createPaymentMethodDto,
  processPaymentDto,
  mockPaymentMethod,
  mockPaymentTransaction,
} from './test/fixtures/payment.fixtures';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentMethodRepository: Repository<PaymentMethod>;
  let transactionRepository: Repository<PaymentTransaction>;
  let mollieProvider: MollieProvider;

  const mockPaymentMethodRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(PaymentMethod),
          useValue: mockPaymentMethodRepository,
        },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: MollieProvider,
          useValue: mockMollieProvider,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentMethodRepository = module.get<Repository<PaymentMethod>>(
      getRepositoryToken(PaymentMethod),
    );
    transactionRepository = module.get<Repository<PaymentTransaction>>(
      getRepositoryToken(PaymentTransaction),
    );
    mollieProvider = module.get<MollieProvider>(MollieProvider);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createPaymentMethod', () => {
    it('should create a payment method successfully', async () => {
      const tenantId = 'tenant-123';
      
      mockMollieProvider.createCustomer.mockResolvedValue('cst_test123');
      mockMollieProvider.createPaymentMethod.mockResolvedValue(mockMolliePaymentMethod);
      mockPaymentMethodRepository.create.mockReturnValue(mockPaymentMethod);
      mockPaymentMethodRepository.save.mockResolvedValue(mockPaymentMethod);

      const result = await service.createPaymentMethod(tenantId, createPaymentMethodDto);

      expect(mockMollieProvider.createCustomer).toHaveBeenCalledWith(
        `tenant-${tenantId}@wasplanning.nl`,
        { tenantId },
      );
      expect(mockMollieProvider.createPaymentMethod).toHaveBeenCalled();
      expect(mockPaymentMethodRepository.create).toHaveBeenCalled();
      expect(mockPaymentMethodRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockPaymentMethod);
    });

    it('should set other payment methods as non-default when creating a default method', async () => {
      const tenantId = 'tenant-123';
      const dtoWithDefault = { ...createPaymentMethodDto, isDefault: true };

      mockMollieProvider.createCustomer.mockResolvedValue('cst_test123');
      mockMollieProvider.createPaymentMethod.mockResolvedValue(mockMolliePaymentMethod);
      mockPaymentMethodRepository.create.mockReturnValue(mockPaymentMethod);
      mockPaymentMethodRepository.save.mockResolvedValue(mockPaymentMethod);

      await service.createPaymentMethod(tenantId, dtoWithDefault);

      expect(mockPaymentMethodRepository.update).toHaveBeenCalledWith(
        { tenantId },
        { isDefault: false },
      );
    });

    it('should throw BadRequestException when Mollie API fails', async () => {
      const tenantId = 'tenant-123';
      
      mockMollieProvider.createCustomer.mockRejectedValue(new Error('Mollie API error'));

      await expect(service.createPaymentMethod(tenantId, createPaymentMethodDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaymentMethods', () => {
    it('should return payment methods for tenant', async () => {
      const tenantId = 'tenant-123';
      const mockMethods = [mockPaymentMethod];

      mockPaymentMethodRepository.find.mockResolvedValue(mockMethods);

      const result = await service.getPaymentMethods(tenantId);

      expect(mockPaymentMethodRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { isDefault: 'DESC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockMethods);
    });
  });

  describe('deletePaymentMethod', () => {
    it('should delete payment method successfully', async () => {
      const tenantId = 'tenant-123';
      const methodId = 'pm-123';

      mockPaymentMethodRepository.findOne.mockResolvedValue(mockPaymentMethod);
      mockMollieProvider.deletePaymentMethod.mockResolvedValue(undefined);

      await service.deletePaymentMethod(tenantId, methodId);

      expect(mockPaymentMethodRepository.findOne).toHaveBeenCalledWith({
        where: { id: methodId, tenantId },
      });
      expect(mockMollieProvider.deletePaymentMethod).toHaveBeenCalledWith(
        mockPaymentMethod.providerMethodId,
      );
      expect(mockPaymentMethodRepository.remove).toHaveBeenCalledWith(mockPaymentMethod);
    });

    it('should throw NotFoundException when payment method not found', async () => {
      const tenantId = 'tenant-123';
      const methodId = 'non-existent';

      mockPaymentMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.deletePaymentMethod(tenantId, methodId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully with specified payment method', async () => {
      const tenantId = 'tenant-123';
      const dtoWithMethod = { ...processPaymentDto, paymentMethodId: 'pm-123' };

      mockPaymentMethodRepository.findOne.mockResolvedValue(mockPaymentMethod);
      mockTransactionRepository.create.mockReturnValue(mockPaymentTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockPaymentTransaction);
      mockMollieProvider.createPayment.mockResolvedValue(mockMolliePayment);

      const result = await service.processPayment(tenantId, dtoWithMethod);

      expect(mockPaymentMethodRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'pm-123', tenantId },
      });
      expect(mockMollieProvider.createPayment).toHaveBeenCalled();
      expect(mockTransactionRepository.save).toHaveBeenCalledTimes(2); // Initial save + update with provider ID
      expect(result).toEqual(mockPaymentTransaction);
    });

    it('should use default payment method when none specified', async () => {
      const tenantId = 'tenant-123';

      mockPaymentMethodRepository.findOne.mockResolvedValue(mockPaymentMethod);
      mockTransactionRepository.create.mockReturnValue(mockPaymentTransaction);
      mockTransactionRepository.save.mockResolvedValue(mockPaymentTransaction);
      mockMollieProvider.createPayment.mockResolvedValue(mockMolliePayment);

      await service.processPayment(tenantId, processPaymentDto);

      expect(mockPaymentMethodRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId, isDefault: true },
      });
    });

    it('should throw BadRequestException when no payment method available', async () => {
      const tenantId = 'tenant-123';

      mockPaymentMethodRepository.findOne.mockResolvedValue(null);

      await expect(service.processPayment(tenantId, processPaymentDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status', async () => {
      const providerTransactionId = 'tr_test123';
      const status = TransactionStatus.COMPLETED;

      await service.updateTransactionStatus(providerTransactionId, status);

      expect(mockTransactionRepository.update).toHaveBeenCalledWith(
        { providerTransactionId },
        { status },
      );
    });
  });

  describe('getTransactions', () => {
    it('should return transactions for tenant', async () => {
      const tenantId = 'tenant-123';
      const mockTransactions = [mockPaymentTransaction];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.getTransactions(tenantId);

      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        where: { tenantId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTransaction', () => {
    it('should return specific transaction', async () => {
      const tenantId = 'tenant-123';
      const transactionId = 'tx-123';

      mockTransactionRepository.findOne.mockResolvedValue(mockPaymentTransaction);

      const result = await service.getTransaction(tenantId, transactionId);

      expect(mockTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: transactionId, tenantId },
      });
      expect(result).toEqual(mockPaymentTransaction);
    });

    it('should throw NotFoundException when transaction not found', async () => {
      const tenantId = 'tenant-123';
      const transactionId = 'non-existent';

      mockTransactionRepository.findOne.mockResolvedValue(null);

      await expect(service.getTransaction(tenantId, transactionId))
        .rejects.toThrow(NotFoundException);
    });
  });
});