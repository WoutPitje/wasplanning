import { vi, beforeEach } from 'vitest'

// Setup test environment
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
} as any

global.sessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
} as any

// Mock global functions
global.useRuntimeConfig = vi.fn(() => ({
  public: {
    apiUrl: 'http://localhost:3001',
    wsUrl: 'ws://localhost:3001',
    appName: 'Wasplanning',
    appVersion: '1.0.0'
  }
}))

global.navigateTo = vi.fn()
global.defineNuxtRouteMiddleware = vi.fn((fn: Function) => fn)
global.$fetch = vi.fn()

// Mock Vue ref and readonly
global.ref = vi.fn((value?: any) => ({ value }))
global.readonly = vi.fn((value: any) => value)

// Mock useAuthStore
global.useAuthStore = vi.fn(() => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  initAuth: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  hasRole: vi.fn(),
  isSuperAdmin: false,
  isGarageAdmin: false,
  tenant: null,
  fullName: ''
}))

// Clean up after each test
beforeEach(() => {
  vi.clearAllMocks()
})