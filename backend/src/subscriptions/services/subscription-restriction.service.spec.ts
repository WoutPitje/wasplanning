import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubscriptionRestrictionService } from './subscription-restriction.service';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';

describe('SubscriptionRestrictionService', () => {
  let service: SubscriptionRestrictionService;
  let subscriptionRepository: jest.Mocked<Repository<Subscription>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionRestrictionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionRestrictionService>(
      SubscriptionRestrictionService,
    );
    subscriptionRepository = module.get(getRepositoryToken(Subscription));
  });

  describe('isWithinGracePeriod', () => {
    it('should return true for active subscriptions', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
      } as any);

      const result = await service.isWithinGracePeriod('tenant-123');
      expect(result).toBe(true);
    });

    it('should return true if within grace period', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5); // 5 days from now

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: futureDate,
      } as any);

      const result = await service.isWithinGracePeriod('tenant-123');
      expect(result).toBe(true);
    });

    it('should return false if past grace period', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // 1 day ago

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: pastDate,
      } as any);

      const result = await service.isWithinGracePeriod('tenant-123');
      expect(result).toBe(false);
    });

    it('should return false if no subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.isWithinGracePeriod('tenant-123');
      expect(result).toBe(false);
    });
  });

  describe('isReadOnly', () => {
    it('should return false for active subscriptions', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
      } as any);

      const result = await service.isReadOnly('tenant-123');
      expect(result).toBe(false);
    });

    it('should return true for canceled subscriptions', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.CANCELED,
      } as any);

      const result = await service.isReadOnly('tenant-123');
      expect(result).toBe(true);
    });

    it('should return false for past_due within grace period', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: futureDate,
      } as any);

      const result = await service.isReadOnly('tenant-123');
      expect(result).toBe(false);
    });

    it('should return true for past_due after grace period', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: pastDate,
      } as any);

      const result = await service.isReadOnly('tenant-123');
      expect(result).toBe(true);
    });

    it('should return true if no subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.isReadOnly('tenant-123');
      expect(result).toBe(true);
    });
  });

  describe('getRestrictionDetails', () => {
    it('should return not restricted for active subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.ACTIVE,
      } as any);

      const result = await service.getRestrictionDetails('tenant-123');
      expect(result).toEqual({
        isRestricted: false,
      });
    });

    it('should return restricted with reason for canceled subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.CANCELED,
      } as any);

      const result = await service.getRestrictionDetails('tenant-123');
      expect(result).toEqual({
        isRestricted: true,
        reason: 'Subscription has been canceled',
      });
    });

    it('should return grace period details for past_due within grace', async () => {
      const gracePeriodEnd = new Date();
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: gracePeriodEnd,
      } as any);

      const result = await service.getRestrictionDetails('tenant-123');
      expect(result).toEqual({
        isRestricted: false,
        reason: 'Payment failed but within grace period',
        gracePeriodEnd: gracePeriodEnd,
        daysRemaining: 5,
      });
    });

    it('should return restricted for past_due after grace period', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      subscriptionRepository.findOne.mockResolvedValue({
        status: SubscriptionStatus.PAST_DUE,
        grace_period_end: pastDate,
      } as any);

      const result = await service.getRestrictionDetails('tenant-123');
      expect(result).toEqual({
        isRestricted: true,
        reason: 'Payment failed and grace period has expired',
      });
    });

    it('should return restricted if no subscription', async () => {
      subscriptionRepository.findOne.mockResolvedValue(null);

      const result = await service.getRestrictionDetails('tenant-123');
      expect(result).toEqual({
        isRestricted: true,
        reason: 'No active subscription found',
      });
    });
  });
});
