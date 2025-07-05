import { ref } from 'vue'
import type { AuditLog, AuditLogFilters, PaginatedResponse } from '~/types/audit'

export const useAuditLogs = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Get authorization header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${authStore.accessToken}`
  })

  const getAuditLogs = async (filters: AuditLogFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      
      if (filters.page) queryParams.append('page', filters.page.toString())
      if (filters.limit) queryParams.append('limit', filters.limit.toString())
      if (filters.user_id) queryParams.append('user_id', filters.user_id)
      if (filters.action) queryParams.append('action', filters.action)
      if (filters.resource_type) queryParams.append('resource_type', filters.resource_type)
      if (filters.start_date) queryParams.append('start_date', filters.start_date)
      if (filters.end_date) queryParams.append('end_date', filters.end_date)
      if (filters.sort) queryParams.append('sort', filters.sort)
      if (filters.order) queryParams.append('order', filters.order)

      const response = await $fetch<PaginatedResponse<AuditLog>>(
        `${config.public.apiUrl}/audit?${queryParams.toString()}`,
        {
          headers: getAuthHeader()
        }
      )

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch audit logs'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const getAuditStats = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<Array<{ action: string; count: number }>>(
        `${config.public.apiUrl}/audit/stats`,
        {
          headers: getAuthHeader()
        }
      )
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch audit stats'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const getUserActivity = async (userId: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<AuditLog[]>(`${config.public.apiUrl}/audit/users/${userId}`, {
        headers: getAuthHeader()
      })
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch user activity'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const exportAuditLogs = async (filters: AuditLogFilters = {}) => {
    loading.value = true
    error.value = null

    try {
      const queryParams = new URLSearchParams()
      
      if (filters.user_id) queryParams.append('user_id', filters.user_id)
      if (filters.action) queryParams.append('action', filters.action)
      if (filters.resource_type) queryParams.append('resource_type', filters.resource_type)
      if (filters.start_date) queryParams.append('start_date', filters.start_date)
      if (filters.end_date) queryParams.append('end_date', filters.end_date)

      const response = await $fetch(`${config.public.apiUrl}/audit/export?${queryParams.toString()}`, {
        responseType: 'blob',
        headers: getAuthHeader()
      })

      // Create download link
      const url = window.URL.createObjectURL(response as Blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export audit logs'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getAuditLogs,
    getAuditStats,
    getUserActivity,
    exportAuditLogs
  }
}