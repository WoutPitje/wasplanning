import type { 
  UserWithoutPassword, 
  CreateUserDto, 
  UpdateUserDto,
  CreateUserResponse 
} from '~/types/users'

export const useAdminUsers = () => {
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
  
  // Get all users (across all tenants for super admin)
  const getUsers = async (): Promise<UserWithoutPassword[] | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UserWithoutPassword[]>(`${config.public.apiUrl}/users`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch users'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get user by ID
  const getUser = async (id: string): Promise<UserWithoutPassword | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<UserWithoutPassword>(`${config.public.apiUrl}/users/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch user'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Create new user
  const createUser = async (data: CreateUserDto): Promise<CreateUserResponse | null> => {
    try {
      pending.value = true
      error.value = null
      
      // Remove empty password field
      const createData = { ...data }
      if (!createData.password || createData.password.trim() === '') {
        delete createData.password
      }
      
      const response = await $fetch<CreateUserResponse>(`${config.public.apiUrl}/users`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: createData
      })
      
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
      
      const response = await $fetch<UserWithoutPassword>(`${config.public.apiUrl}/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: data
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update user'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Reset user password
  const resetUserPassword = async (id: string, newPassword: string): Promise<{ message: string } | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<{ message: string }>(`${config.public.apiUrl}/users/${id}/reset-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: { newPassword }
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to reset password'
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
    getUsers,
    getUser,
    createUser,
    updateUser,
    resetUserPassword,
    
    // Utils
    clearError: () => { error.value = null }
  }
}