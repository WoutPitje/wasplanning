import { defineStore } from 'pinia'
import { type User, UserRole, type LoginResponse } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  impersonation: {
    is_impersonating: boolean
    impersonator_id: string
    impersonator_email: string
  } | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    impersonation: null
  }),

  getters: {
    // Check if user has specific role
    hasRole: (state) => (role: UserRole): boolean => {
      return state.user?.role === role
    },

    // Check if user is super admin
    isSuperAdmin: (state): boolean => {
      return state.user?.role === UserRole.SUPER_ADMIN
    },

    // Check if user is garage admin
    isGarageAdmin: (state): boolean => {
      return state.user?.role === UserRole.GARAGE_ADMIN
    },

    // Get user's tenant info
    tenant: (state) => {
      return state.user?.tenant || null
    },

    // Get full user name
    fullName: (state): string => {
      if (!state.user) return ''
      return `${state.user.first_name} ${state.user.last_name}`
    }
  },

  actions: {
    // Set authentication data
    setAuth(response: LoginResponse) {
      this.accessToken = response.access_token
      this.refreshToken = response.refresh_token
      this.user = response.user
      this.isAuthenticated = true
      this.impersonation = response.impersonation || null
      
      // Store in localStorage for persistence
      if (import.meta.client) {
        localStorage.setItem('access_token', response.access_token)
        localStorage.setItem('refresh_token', response.refresh_token)
        localStorage.setItem('user', JSON.stringify(response.user))
        if (response.impersonation) {
          localStorage.setItem('impersonation', JSON.stringify(response.impersonation))
        } else {
          localStorage.removeItem('impersonation')
        }
      }
    },

    // Clear authentication data
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      this.impersonation = null
      
      // Clear from localStorage
      if (import.meta.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('impersonation')
      }
    },

    // Initialize auth from localStorage
    initAuth() {
      if (import.meta.client) {
        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        const userData = localStorage.getItem('user')
        const impersonationData = localStorage.getItem('impersonation')
        
        if (accessToken && refreshToken && userData) {
          try {
            const user = JSON.parse(userData)
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.user = user
            this.isAuthenticated = true
            
            if (impersonationData) {
              this.impersonation = JSON.parse(impersonationData)
            }
          } catch (error) {
            // Invalid stored data, clear everything
            this.clearAuth()
          }
        }
      }
    },

    // Update user data
    updateUser(user: User) {
      this.user = user
      
      if (import.meta.client) {
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    // Update tokens
    updateTokens(accessToken: string, refreshToken: string) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      
      if (import.meta.client) {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
      }
    },

    // Login action
    async login(credentials: { email: string; password: string }) {
      const { login } = useAuth()
      
      const response = await login(credentials)
      if (response) {
        this.setAuth(response)
        return true
      }
      return false
    },

    // Logout action
    async logout() {
      // Could add API call to invalidate tokens on server
      this.clearAuth()
      await navigateTo('/login')
    },

    // Refresh token action
    async refreshTokens() {
      if (!this.refreshToken) return false
      
      const { refreshToken } = useAuth()
      
      const response = await refreshToken({ refresh_token: this.refreshToken })
      if (response) {
        this.updateTokens(response.access_token, response.refresh_token)
        this.updateUser(response.user)
        return true
      } else {
        // Refresh failed, clear auth
        this.clearAuth()
        return false
      }
    }
  }
})