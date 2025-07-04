import type { LoginDto, LoginResponse, RefreshTokenDto, User } from '~/types/auth'

export const useAuth = () => {
  const config = useRuntimeConfig()
  
  
  // State management
  const pending = ref(false)
  const error = ref<string | null>(null)
  
  // Login user
  const login = async (credentials: LoginDto): Promise<LoginResponse | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<LoginResponse>(`${config.public.apiUrl}/auth/login`, {
        method: 'POST',
        body: credentials
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Login failed'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Refresh token
  const refreshToken = async (refreshTokenDto: RefreshTokenDto): Promise<LoginResponse | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<LoginResponse>(`${config.public.apiUrl}/auth/refresh`, {
        method: 'POST',
        body: refreshTokenDto
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Token refresh failed'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Get user profile
  const getProfile = async (token: string): Promise<User | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<User>(`${config.public.apiUrl}/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to get profile'
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
    login,
    refreshToken,
    getProfile,
    
    // Utils
    clearError: () => { error.value = null }
  }
}