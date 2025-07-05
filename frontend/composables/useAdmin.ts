import type { 
  CreateTenantDto, 
  UpdateTenantDto, 
  CreateTenantResponse, 
  TenantWithUsers,
  TenantStats 
} from '~/types/admin'
import type { Tenant } from '~/types/auth'

export const useAdmin = () => {
  const config = useRuntimeConfig()
  
  // State management
  const pending = ref(false)
  const error = ref<string | null>(null)
  
  // Get auth token from store
  const getAuthHeaders = () => {
    const authStore = useAuthStore()
    return {
      Authorization: `Bearer ${authStore.accessToken}`
    }
  }
  
  // Create new tenant
  const createTenant = async (data: CreateTenantDto): Promise<CreateTenantResponse | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<CreateTenantResponse>(`${config.public.apiUrl}/admin/tenants`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create tenant'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get all tenants
  const getTenants = async (): Promise<Tenant[] | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Tenant[]>(`${config.public.apiUrl}/admin/tenants`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch tenants'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get tenant by ID with users
  const getTenant = async (id: string): Promise<TenantWithUsers | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<TenantWithUsers>(`${config.public.apiUrl}/admin/tenants/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch tenant'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get tenant statistics
  const getTenantStats = async (id: string): Promise<TenantStats | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<TenantStats>(`${config.public.apiUrl}/admin/tenants/${id}/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch tenant stats'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Update tenant
  const updateTenant = async (id: string, data: UpdateTenantDto): Promise<Tenant | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<Tenant>(`${config.public.apiUrl}/admin/tenants/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: data
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update tenant'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Deactivate tenant
  const deactivateTenant = async (id: string): Promise<{ message: string } | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<{ message: string }>(`${config.public.apiUrl}/admin/tenants/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to deactivate tenant'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Upload tenant logo
  const uploadTenantLogo = async (tenantId: string, file: File): Promise<{ logo_url: string } | null> => {
    try {
      pending.value = true
      error.value = null
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await $fetch<{ logo_url: string }>(`${config.public.apiUrl}/admin/tenants/${tenantId}/logo`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to upload logo'
      return null
    } finally {
      pending.value = false
    }
  }
  
  return {
    // State
    pending: readonly(pending),
    error: readonly(error),
    
    // Methods
    createTenant,
    getTenants,
    getTenant,
    getTenantStats,
    updateTenant,
    deactivateTenant,
    uploadTenantLogo,
    
    // Utils
    clearError: () => { error.value = null }
  }
}