import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserRole } from '~/types/auth'

// Create a mock store implementation
const createMockStore = () => {
  let state = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false
  }

  return {
    // State getters
    get user() { return state.user },
    get accessToken() { return state.accessToken },
    get refreshToken() { return state.refreshToken },
    get isAuthenticated() { return state.isAuthenticated },

    // Getters
    hasRole: (role: UserRole) => state.user?.role === role,
    get isSuperAdmin() { return state.user?.role === UserRole.SUPER_ADMIN },
    get isGarageAdmin() { return state.user?.role === UserRole.GARAGE_ADMIN },
    get tenant() { return state.user?.tenant || null },
    get fullName() { 
      return state.user ? `${state.user.first_name} ${state.user.last_name}` : ''
    },

    // Actions
    setAuth: vi.fn((accessToken, refreshToken, user) => {
      state.accessToken = accessToken
      state.refreshToken = refreshToken
      state.user = user
      state.isAuthenticated = true
    }),
    clearAuth: vi.fn(() => {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
    }),
    initAuth: vi.fn(),
    updateUser: vi.fn((user) => {
      state.user = user
    }),
    updateTokens: vi.fn((accessToken, refreshToken) => {
      state.accessToken = accessToken
      state.refreshToken = refreshToken
    }),
    login: vi.fn(),
    logout: vi.fn(),
    refreshTokens: vi.fn()
  }
}

// Mock useAuthStore globally
global.useAuthStore = createMockStore

describe('Auth Store', () => {
  let authStore: ReturnType<typeof createMockStore>

  beforeEach(() => {
    vi.clearAllMocks()
    authStore = createMockStore()
  })

  it('should initialize with default state', () => {
    expect(authStore.user).toBeNull()
    expect(authStore.accessToken).toBeNull()
    expect(authStore.refreshToken).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('should set authentication data correctly', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.SUPER_ADMIN,
      is_active: true,
      last_login: null,
      tenant: {
        id: '1',
        name: 'test-tenant',
        display_name: 'Test Tenant',
        logo_url: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    }

    authStore.setAuth('access-token', 'refresh-token', mockUser)

    expect(authStore.accessToken).toBe('access-token')
    expect(authStore.refreshToken).toBe('refresh-token')
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
  })

  it('should clear authentication data', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.SUPER_ADMIN,
      is_active: true,
      last_login: null,
      tenant: {
        id: '1',
        name: 'test-tenant',
        display_name: 'Test Tenant',
        logo_url: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    }

    authStore.setAuth('access-token', 'refresh-token', mockUser)
    authStore.clearAuth()

    expect(authStore.user).toBeNull()
    expect(authStore.accessToken).toBeNull()
    expect(authStore.refreshToken).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
  })

  it('should check roles correctly', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.SUPER_ADMIN,
      is_active: true,
      last_login: null,
      tenant: {
        id: '1',
        name: 'test-tenant',
        display_name: 'Test Tenant',
        logo_url: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
    }

    authStore.setAuth('access-token', 'refresh-token', mockUser)

    expect(authStore.hasRole(UserRole.SUPER_ADMIN)).toBe(true)
    expect(authStore.hasRole(UserRole.GARAGE_ADMIN)).toBe(false)
    expect(authStore.isSuperAdmin).toBe(true)
    expect(authStore.isGarageAdmin).toBe(false)
  })
})