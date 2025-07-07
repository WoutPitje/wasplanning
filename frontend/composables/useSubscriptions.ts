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
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  // Reactive state
  const pending = ref(false)
  const error = ref<string | null>(null)

  // Get authorization header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${authStore.accessToken}`
  })

  // Subscription Plans
  const getPlans = async (): Promise<SubscriptionPlan[] | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<SubscriptionPlan[]>(`${config.public.apiUrl}/subscriptions/plans`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to fetch plans'
      return null
    } finally {
      pending.value = false
    }
  }

  const getPlan = async (id: string): Promise<SubscriptionPlan | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<SubscriptionPlan>(`${config.public.apiUrl}/subscriptions/plans/${id}`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to fetch plan'
      return null
    } finally {
      pending.value = false
    }
  }

  // Current Subscription
  const getCurrentSubscription = async (): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions/current`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      // 404 means no subscription, which is valid
      if (err.statusCode === 404) {
        return null
      }
      error.value = err.data?.message || err.message || 'Failed to fetch subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  const createSubscription = async (dto: CreateSubscriptionDto): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: dto
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to create subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  const updateSubscription = async (id: string, dto: UpdateSubscriptionDto): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions/${id}`, {
        method: 'PATCH',
        headers: getAuthHeader(),
        body: dto
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to update subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  const cancelSubscription = async (id: string, immediately: boolean = false): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions/${id}?immediately=${immediately}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to cancel subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  // Usage and Billing
  const getCurrentUsage = async (): Promise<UsageData | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UsageData>(`${config.public.apiUrl}/subscriptions/usage/current-period`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to fetch usage data'
      return null
    } finally {
      pending.value = false
    }
  }

  // Payment Methods
  const getPaymentMethods = async (): Promise<PaymentMethod[] | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<PaymentMethod[]>(`${config.public.apiUrl}/payments/methods`, {
        method: 'GET',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to fetch payment methods'
      return null
    } finally {
      pending.value = false
    }
  }

  const createPaymentMethod = async (dto: CreatePaymentMethodDto): Promise<PaymentMethod | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<PaymentMethod>(`${config.public.apiUrl}/payments/methods`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: dto
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to create payment method'
      return null
    } finally {
      pending.value = false
    }
  }

  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(`${config.public.apiUrl}/payments/methods/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to delete payment method'
      return false
    } finally {
      pending.value = false
    }
  }

  const setDefaultPaymentMethod = async (id: string): Promise<PaymentMethod | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<PaymentMethod>(`${config.public.apiUrl}/payments/methods/${id}/set-default`, {
        method: 'PATCH',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to set default payment method'
      return null
    } finally {
      pending.value = false
    }
  }

  // Payment and Checkout
  const createPaidSubscription = async (plan: SubscriptionPlan, billingInterval: 'monthly' | 'yearly'): Promise<{ checkoutUrl: string } | null> => {
    try {
      pending.value = true
      error.value = null
      
      // Build return URL
      const returnUrl = `${window.location.origin}/garage-admin/payment-return?action=new`
      
      const response = await $fetch<{ checkoutUrl: string }>(`${config.public.apiUrl}/subscriptions/paid`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: { 
          planName: plan.name,
          billingInterval: billingInterval === 'yearly' ? 'year' : 'month',
          returnUrl
        }
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to create paid subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  const changePlan = async (subscriptionId: string, newPlan: SubscriptionPlan, billingInterval: 'monthly' | 'yearly'): Promise<{ checkoutUrl: string } | Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      // Build return URL
      const returnUrl = `${window.location.origin}/garage-admin/payment-return?action=change`
      
      const response = await $fetch<{ checkoutUrl: string } | Subscription>(`${config.public.apiUrl}/subscriptions/${subscriptionId}/change-plan`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: { 
          newPlanName: newPlan.name,
          billingInterval: billingInterval === 'yearly' ? 'year' : 'month',
          returnUrl
        }
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to change plan'
      return null
    } finally {
      pending.value = false
    }
  }

  const completeNewSubscription = async (paymentId: string): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions/complete-new/${paymentId}`, {
        method: 'POST',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to complete subscription'
      return null
    } finally {
      pending.value = false
    }
  }

  const completeChangePlan = async (paymentId: string): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(`${config.public.apiUrl}/subscriptions/complete-change/${paymentId}`, {
        method: 'POST',
        headers: getAuthHeader()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to complete plan change'
      return null
    } finally {
      pending.value = false
    }
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
    pending: readonly(pending),
    loading: readonly(pending), // Keep for backward compatibility
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

    // Payment and Checkout
    createPaidSubscription,
    changePlan,
    completeNewSubscription,
    completeChangePlan,

    // Utilities
    formatPrice,
    calculateYearlySavings,
    getUsagePercentage,
    isFeatureAvailable,
    getUsageWarningLevel,
  }
}