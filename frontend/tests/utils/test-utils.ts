import { vi } from 'vitest'
import { type User, UserRole } from '~/types/auth'

export const createMockUser = (role: UserRole = UserRole.SUPER_ADMIN): User => ({
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role,
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
})

export const createMockAuthStore = (isAuthenticated = false, user: User | null = null) => ({
  isAuthenticated,
  user,
  accessToken: isAuthenticated ? 'mock-token' : null,
  refreshToken: isAuthenticated ? 'mock-refresh-token' : null,
  initAuth: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  updateUser: vi.fn(),
  updateTokens: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refreshTokens: vi.fn(),
  hasRole: vi.fn((role: UserRole) => user?.role === role),
  isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
  isGarageAdmin: user?.role === UserRole.GARAGE_ADMIN,
  tenant: user?.tenant || null,
  fullName: user ? `${user.first_name} ${user.last_name}` : ''
})

export const mockNuxtComposables = () => {
  const mockNavigateTo = vi.fn()
  
  vi.mock('#app', () => ({
    useAuthStore: () => createMockAuthStore(),
    navigateTo: mockNavigateTo,
    defineNuxtRouteMiddleware: (fn: Function) => fn,
    useRuntimeConfig: () => ({
      public: {
        apiUrl: 'http://localhost:3001'
      }
    }),
    $fetch: vi.fn()
  }))

  return { mockNavigateTo }
}

export const setupTestEnvironment = () => {
  // Setup DOM environment
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }

  global.sessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  }

  // Mock window.location
  Object.defineProperty(window, 'location', {
    value: {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    writable: true
  })
}

export const createMockLoginResponse = (user?: Partial<User>) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: createMockUser(user?.role || UserRole.SUPER_ADMIN)
})

export const createMockApiError = (message = 'API Error', statusCode = 400) => ({
  data: {
    statusCode,
    message,
    error: 'Bad Request'
  }
})