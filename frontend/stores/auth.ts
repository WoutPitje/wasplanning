import { defineStore } from 'pinia'
import type { User, UserRole } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  }),

  getters: {
    // Check if user has specific role
    hasRole: (state) => (role: UserRole): boolean => {
      return state.user?.role === role
    },

    // Check if user is super admin
    isSuperAdmin: (state): boolean => {
      return state.user?.role === 'super_admin'
    },

    // Check if user is garage admin
    isGarageAdmin: (state): boolean => {
      return state.user?.role === 'garage_admin'
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
    setAuth(accessToken: string, refreshToken: string, user: User) {
      this.accessToken = accessToken
      this.refreshToken = refreshToken
      this.user = user
      this.isAuthenticated = true
      
      // Store in localStorage for persistence
      if (import.meta.client) {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('user', JSON.stringify(user))
      }
    },

    // Clear authentication data
    clearAuth() {
      this.user = null
      this.accessToken = null
      this.refreshToken = null
      this.isAuthenticated = false
      
      // Clear from localStorage
      if (import.meta.client) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      }
    },

    // Initialize auth from localStorage
    initAuth() {
      if (import.meta.client) {
        const accessToken = localStorage.getItem('access_token')
        const refreshToken = localStorage.getItem('refresh_token')
        const userData = localStorage.getItem('user')
        
        if (accessToken && refreshToken && userData) {
          try {
            const user = JSON.parse(userData)
            this.accessToken = accessToken
            this.refreshToken = refreshToken
            this.user = user
            this.isAuthenticated = true
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
        this.setAuth(response.access_token, response.refresh_token, response.user)
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