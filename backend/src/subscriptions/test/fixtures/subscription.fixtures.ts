import { SubscriptionPlan, PlanName, BillingType } from '../../entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus, BillingInterval } from '../../entities/subscription.entity';
import { UsageRecord, MetricType } from '../../entities/usage-record.entity';
import { CreateSubscriptionDto } from '../../dto/create-subscription.dto';
import { UpdateSubscriptionDto } from '../../dto/update-subscription.dto';
import { RecordUsageDto } from '../../dto/record-usage.dto';

export const mockSubscriptionPlan: Partial<SubscriptionPlan> = {
  id: 'plan-123',
  name: PlanName.STARTER,
  displayName: 'Starter',
  priceMonthly: 49.00,
  priceYearly: 529.20,
  billingType: BillingType.SUBSCRIPTION,
  maxLocations: 1,
  maxCarsPerMonth: 500,
  maxUsers: 5,
  features: {
    basic_features: true,
    advanced_reporting: false,
    api_access: false,
  },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockGroeiPlan: Partial<SubscriptionPlan> = {
  id: 'plan-456',
  name: PlanName.GROEI,
  displayName: 'Groei',
  priceMonthly: 149.00,
  priceYearly: 1604.40,
  billingType: BillingType.HYBRID,
  maxLocations: 3,
  maxCarsPerMonth: 2000,
  maxUsers: undefined,
  features: {
    basic_features: true,
    advanced_reporting: true,
    api_access: true,
  },
  overagePricePerCar: 0.10,
  overagePricePerLocation: 39.00,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSubscription: Partial<Subscription> = {
  id: 'sub-123',
  tenantId: 'tenant-123',
  planId: 'plan-123',
  status: SubscriptionStatus.ACTIVE,
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  billingInterval: BillingInterval.MONTH,
  trialEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  metadata: {},
  plan: mockSubscriptionPlan as SubscriptionPlan,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockUsageRecord: Partial<UsageRecord> = {
  id: 'usage-123',
  subscriptionId: 'sub-123',
  metricType: MetricType.CARS_WASHED,
  quantity: 1,
  recordedAt: new Date(),
  metadata: { washTaskId: 'wash-123' },
};


export const createSubscriptionDto: CreateSubscriptionDto = {
  planName: PlanName.STARTER,
  billingInterval: BillingInterval.MONTH,
  metadata: { source: 'test' },
};

export const updateSubscriptionDto: UpdateSubscriptionDto = {
  planName: PlanName.GROEI,
  cancelAtPeriodEnd: false,
  metadata: { updated: true },
};

export const recordUsageDto: RecordUsageDto = {
  metricType: MetricType.CARS_WASHED,
  quantity: 1,
  metadata: { washTaskId: 'wash-123' },
};

export const mockTenant = {
  id: 'tenant-123',
  name: 'Test Garage',
  email: 'test@garage.com',
};

export const mockUser = {
  id: 'user-123',
  email: 'admin@garage.com',
  tenant: mockTenant,
};