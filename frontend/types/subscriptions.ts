export interface SubscriptionPlan {
  id: string
  name: string
  displayName: string
  priceMonthly: number
  priceYearly: number
  billingType: 'subscription' | 'hybrid' | 'usage'
  maxLocations?: number
  maxCarsPerMonth?: number
  maxUsers?: number
  features: Record<string, boolean>
  overagePricePerCar?: number
  overagePricePerLocation?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  tenantId: string
  planId: string
  plan: SubscriptionPlan
  paymentMethodId?: string
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodStart: string
  currentPeriodEnd: string
  billingInterval: 'month' | 'year'
  provider?: string
  providerSubscriptionId?: string
  trialEnd?: string
  canceledAt?: string
  cancelAtPeriodEnd: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateSubscriptionDto {
  planName: string
  billingInterval: 'month' | 'year'
  metadata?: Record<string, any>
}

export interface UpdateSubscriptionDto {
  planName?: string
  cancelAtPeriodEnd?: boolean
  metadata?: Record<string, any>
}

export interface UsageData {
  subscription: Subscription
  usage: {
    cars_washed: number
    active_users: number
    active_locations: number
  }
  limits: {
    cars: {
      allowed: boolean
      current: number
      limit?: number
      percentage: number
    }
    users: {
      allowed: boolean
      current: number
      limit?: number
      percentage: number
    }
    locations: {
      allowed: boolean
      current: number
      limit?: number
      percentage: number
    }
    features: Record<string, boolean>
  }
  warnings: {
    warning: boolean
    critical: boolean
    messages: string[]
  }
}

export interface PaymentMethod {
  id: string
  tenantId: string
  provider: string
  providerMethodId: string
  type: string
  isDefault: boolean
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentMethodDto {
  type: string
  details: Record<string, any>
  isDefault?: boolean
  metadata?: Record<string, any>
}