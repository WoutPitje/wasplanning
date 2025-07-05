import type {
  SubscriptionPlan,
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  UsageData,
  PaymentMethod,
  CreatePaymentMethodDto,
} from '~/types/subscriptions'

export const useSubscriptions = () => {
  // Reactive state
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Helper function for API calls
  const apiCall = async <T>(url: string, options?: any): Promise<T> => {
    loading.value = true
    error.value = null
    
    try {
      const response = await $fetch<T>(url, {
        baseURL: 'http://localhost:3001',
        ...options,
      })
      return response
    } catch (err: any) {
      error.value = err.message || 'An error occurred'
      throw err
    } finally {
      loading.value = false
    }
  }

  // Subscription Plans
  const getPlans = async (): Promise<SubscriptionPlan[]> => {
    return apiCall<SubscriptionPlan[]>('/subscriptions/plans')
  }

  const getPlan = async (id: string): Promise<SubscriptionPlan> => {
    return apiCall<SubscriptionPlan>(`/subscriptions/plans/${id}`)
  }

  // Current Subscription
  const getCurrentSubscription = async (): Promise<Subscription | null> => {
    return apiCall<Subscription | null>('/subscriptions/current')
  }

  const createSubscription = async (dto: CreateSubscriptionDto): Promise<Subscription> => {
    return apiCall<Subscription>('/subscriptions', {
      method: 'POST',
      body: dto,
    })
  }

  const updateSubscription = async (id: string, dto: UpdateSubscriptionDto): Promise<Subscription> => {
    return apiCall<Subscription>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: dto,
    })
  }

  const cancelSubscription = async (id: string, immediately: boolean = false): Promise<Subscription> => {
    return apiCall<Subscription>(`/subscriptions/${id}`, {
      method: 'DELETE',
      query: { immediately },
    })
  }

  // Usage and Billing
  const getCurrentUsage = async (): Promise<UsageData> => {
    return apiCall<UsageData>('/subscriptions/usage/current-period')
  }

  // Payment Methods
  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    return apiCall<PaymentMethod[]>('/payments/methods')
  }

  const createPaymentMethod = async (dto: CreatePaymentMethodDto): Promise<PaymentMethod> => {
    return apiCall<PaymentMethod>('/payments/methods', {
      method: 'POST',
      body: dto,
    })
  }

  const deletePaymentMethod = async (id: string): Promise<void> => {
    return apiCall<void>(`/payments/methods/${id}`, {
      method: 'DELETE',
    })
  }

  const setDefaultPaymentMethod = async (id: string): Promise<PaymentMethod> => {
    return apiCall<PaymentMethod>(`/payments/methods/${id}/set-default`, {
      method: 'PATCH',
    })
  }

  // Utility functions
  const formatPrice = (price: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency,
    }).format(price)
  }

  const calculateYearlySavings = (monthlyPrice: number, yearlyPrice: number): number => {
    return (monthlyPrice * 12) - yearlyPrice
  }

  const getUsagePercentage = (current: number, limit?: number): number => {
    if (!limit) return 0
    return Math.round((current / limit) * 100)
  }

  const isFeatureAvailable = (features: Record<string, boolean>, feature: string): boolean => {
    return features[feature] === true
  }

  const getUsageWarningLevel = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 90) return 'error'
    if (percentage >= 75) return 'warning'
    return 'success'
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),

    // Subscription Plans
    getPlans,
    getPlan,

    // Current Subscription
    getCurrentSubscription,
    createSubscription,
    updateSubscription,
    cancelSubscription,

    // Usage
    getCurrentUsage,

    // Payment Methods
    getPaymentMethods,
    createPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,

    // Utilities
    formatPrice,
    calculateYearlySavings,
    getUsagePercentage,
    isFeatureAvailable,
    getUsageWarningLevel,
  }
}