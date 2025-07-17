export enum SubscriptionTier {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  INCOMPLETE = 'INCOMPLETE',
  TRIALING = 'TRIALING',
  EXPIRED = 'EXPIRED',
}

export interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price_cents: number
  price_euros: number
  price_display: string
  max_cars_per_month: number | null
  max_active_users: number | null
  max_locations: number | null
  features: {
    api_access: boolean
    advanced_reporting: boolean
    custom_branding: boolean
    priority_support: boolean
    export_data: boolean
    multi_location: boolean
  }
  is_current: boolean
  is_recommended: boolean
}

export interface Subscription {
  id: string
  tenant_id: string
  plan_name: string
  plan_display_name: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  days_remaining: number
  price_cents: number
  price_euros: number
  usage: {
    cars_washed: {
      current: number
      limit: number | null
      percentage: number
    }
    active_users: {
      current: number
      limit: number | null
      percentage: number
    }
    locations: {
      current: number
      limit: number | null
      percentage: number
    }
  }
  features: {
    api_access: boolean
    advanced_reporting: boolean
    custom_branding: boolean
    priority_support: boolean
    export_data: boolean
    multi_location: boolean
  }
  stripe_customer_id?: string
  stripe_subscription_id?: string
  payment_failed_at?: string
  payment_failure_count?: number
  grace_period_end?: string
  cancel_at_period_end?: boolean
  cancel_at?: string
  canceled_at?: string
}

export enum PaymentMethodType {
  CARD = 'card',
  SEPA_DEBIT = 'sepa_debit',
}

export enum CardBrand {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  DINERS = 'diners',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
  UNKNOWN = 'unknown',
}

export interface PaymentMethod {
  id: string
  type: PaymentMethodType
  is_default: boolean
  card_brand?: CardBrand
  card_last4?: string
  card_exp_month?: number
  card_exp_year?: number
  bank_name?: string
  bank_last4?: string
  billing_name?: string
  billing_email?: string
  created_at: string
  display_string: string
}

export interface UsageItem {
  current: number
  limit: number | null
  remaining: number | null
  percentage: number
  is_approaching_limit: boolean
  is_at_limit: boolean
}

export interface UsageResponse {
  period_start: string
  period_end: string
  days_remaining: number
  cars_washed: UsageItem
  active_users: UsageItem
  locations: UsageItem
  summary: {
    at_limit: string[]
    approaching_limit: string[]
  }
}

export interface AttachPaymentMethodDto {
  payment_method_id: string
}

export interface ChangePlanDto {
  plan_id: string
  payment_method_id?: string
  immediate?: boolean
}

export interface StripeSetupIntent {
  client_secret: string
  payment_method_types: string[]
}