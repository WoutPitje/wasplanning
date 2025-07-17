import type { 
  Subscription, 
  SubscriptionPlan, 
  PaymentMethod, 
  UsageRecord,
  AttachPaymentMethodDto,
  ChangePlanDto,
  StripeSetupIntent
} from '~/types/subscriptions'

export const useSubscriptions = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  // State management
  const pending = ref(false)
  const error = ref<string | null>(null)
  
  // Get authorization header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${authStore.accessToken}`
  })
  
  // Get current subscription
  const getSubscription = async (): Promise<Subscription | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Subscription>(
        `${config.public.apiUrl}/subscriptions/current`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch subscription'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get all plans
  const getPlans = async (): Promise<SubscriptionPlan[]> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<SubscriptionPlan[]>(
        `${config.public.apiUrl}/subscriptions/plans`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch plans'
      return []
    } finally {
      pending.value = false
    }
  }
  
  // Get current usage
  const getUsage = async (): Promise<UsageRecord[]> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UsageRecord[]>(
        `${config.public.apiUrl}/subscriptions/usage`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch usage'
      return []
    } finally {
      pending.value = false
    }
  }
  
  // Change subscription plan
  const changePlan = async (data: ChangePlanDto): Promise<any> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<any>(
        `${config.public.apiUrl}/subscriptions/upgrade`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to change plan'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Cancel subscription
  const cancelSubscription = async (): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/subscriptions/cancel`,
        {
          method: 'POST',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to cancel subscription'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Reactivate subscription (cancel the scheduled downgrade)
  const reactivateSubscription = async (): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/subscriptions/reactivate`,
        {
          method: 'POST',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to reactivate subscription'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Get payment methods
  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<PaymentMethod[]>(
        `${config.public.apiUrl}/payments/methods`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch payment methods'
      return []
    } finally {
      pending.value = false
    }
  }
  
  // Create setup intent for adding payment method
  const createSetupIntent = async (): Promise<StripeSetupIntent | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<StripeSetupIntent>(
        `${config.public.apiUrl}/payments/setup-intent`,
        {
          method: 'POST',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create setup intent'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Add payment method
  const addPaymentMethod = async (data: AttachPaymentMethodDto): Promise<PaymentMethod | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<PaymentMethod>(
        `${config.public.apiUrl}/payments/methods`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to add payment method'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Set default payment method
  const setDefaultPaymentMethod = async (id: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/payments/methods/${id}/default`,
        {
          method: 'PUT',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to set default payment method'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Delete payment method
  const deletePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/payments/methods/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete payment method'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Get invoices
  const getInvoices = async (params?: { limit?: number; starting_after?: string }): Promise<any> => {
    try {
      pending.value = true
      error.value = null
      
      const queryParams = new URLSearchParams()
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.starting_after) queryParams.append('starting_after', params.starting_after)
      
      const response = await $fetch(
        `${config.public.apiUrl}/subscriptions/invoices${queryParams.toString() ? '?' + queryParams.toString() : ''}`,
        {
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to load invoices'
      return { invoices: [], has_more: false }
    } finally {
      pending.value = false
    }
  }
  
  return {
    // State
    pending: readonly(pending),
    error: readonly(error),
    
    // Methods
    getSubscription,
    getPlans,
    getUsage,
    changePlan,
    cancelSubscription,
    reactivateSubscription,
    getPaymentMethods,
    createSetupIntent,
    addPaymentMethod,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    getInvoices,
    
    // Utils
    clearError: () => { error.value = null }
  }
}