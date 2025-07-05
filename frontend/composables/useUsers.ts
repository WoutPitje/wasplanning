import type { X } from 'lucide-vue-next'
import type { 
  CreateUserDto, 
  UpdateUserDto, 
  ResetPasswordDto, 
  CreateUserResponse, 
  UserWithoutPassword,
  UserFilters,
  PaginatedResponse
} from '~/types/users'

export const useUsers = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  // State management
  const pending = ref(false)
  const error = ref<string | null>(null)
  
  // Get authorization header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${authStore.accessToken}`
  })
  
  // Get all users with pagination
  const getUsers = async (filters?: UserFilters): Promise<PaginatedResponse<UserWithoutPassword>> => {
    try {
      pending.value = true
      error.value = null
      
      const queryParams = new URLSearchParams()
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.role) queryParams.append('role', filters.role)
      if (filters?.tenant) queryParams.append('tenant', filters.tenant)
      if (filters?.is_active !== undefined) queryParams.append('is_active', String(filters.is_active))
      if (filters?.page) queryParams.append('page', String(filters.page))
      if (filters?.limit) queryParams.append('limit', String(filters.limit))
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder)
      
      const response = await $fetch<PaginatedResponse<UserWithoutPassword>>(
        `${config.public.apiUrl}/users${queryParams.toString() ? `?${queryParams}` : ''}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch users'
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 20, totalPages: 0 }
      }
    } finally {
      pending.value = false
    }
  }
  
  // Get single user
  const getUser = async (id: string): Promise<UserWithoutPassword | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UserWithoutPassword>(
        `${config.public.apiUrl}/users/${id}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch user'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Create user
  const createUser = async (data: CreateUserDto): Promise<CreateUserResponse | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<CreateUserResponse>(
        `${config.public.apiUrl}/users`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create user'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Update user
  const updateUser = async (id: string, data: UpdateUserDto): Promise<UserWithoutPassword | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UserWithoutPassword>(
        `${config.public.apiUrl}/users/${id}`,
        {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update user'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Reset password
  const resetPassword = async (id: string, password: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      const data: ResetPasswordDto = { new_password: password }
      
      await $fetch(
        `${config.public.apiUrl}/users/${id}/password`,
        {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to reset password'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Deactivate user
  const deactivateUser = async (id: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/users/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to deactivate user'
      return false
    } finally {
      pending.value = false
    }
  }
  
  return {
    // State
    pending: readonly(pending),
    error: readonly(error),
    
    // Methods
    getUsers,
    getUser,
    createUser,
    updateUser,
    resetPassword,
    deactivateUser,
    
    // Utils
    clearError: () => { error.value = null }
  }
}