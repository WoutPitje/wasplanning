import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('useAuth Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global $fetch mock
    global.$fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const { pending, error } = useAuth()
    
    expect(pending.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should login successfully', async () => {
    const mockResponse = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'super_admin',
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
    }

    global.$fetch.mockResolvedValueOnce(mockResponse)

    const { useAuth } = await import('~/composables/useAuth')
    const { login, pending, error } = useAuth()
    
    const result = await login({
      email: 'test@example.com',
      password: 'password'
    })

    expect(global.$fetch).toHaveBeenCalledWith('http://localhost:3001/auth/login', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password'
      }
    })

    expect(result).toEqual(mockResponse)
    expect(pending.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should handle login errors', async () => {
    const mockError = {
      data: {
        message: 'Invalid credentials'
      }
    }

    global.$fetch.mockRejectedValueOnce(mockError)

    const { useAuth } = await import('~/composables/useAuth')
    const { login, pending, error } = useAuth()
    
    const result = await login({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    })

    expect(result).toBeNull()
    expect(pending.value).toBe(false)
    expect(error.value).toBe('Invalid credentials')
  })

  it('should handle generic login errors', async () => {
    const mockError = new Error('Network error')

    global.$fetch.mockRejectedValueOnce(mockError)

    const { useAuth } = await import('~/composables/useAuth')
    const { login, pending, error } = useAuth()
    
    const result = await login({
      email: 'test@example.com',
      password: 'password'
    })

    expect(result).toBeNull()
    expect(pending.value).toBe(false)
    expect(error.value).toBe('Network error')
  })

  it('should refresh token successfully', async () => {
    const mockResponse = {
      access_token: 'new-token',
      refresh_token: 'new-refresh-token',
      user: {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'super_admin',
        is_active: true,
        last_login: new Date().toISOString(),
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
    }

    global.$fetch.mockResolvedValueOnce(mockResponse)

    const { useAuth } = await import('~/composables/useAuth')
    const { refreshToken, pending, error } = useAuth()
    
    const result = await refreshToken({
      refresh_token: 'old-refresh-token'
    })

    expect(global.$fetch).toHaveBeenCalledWith('http://localhost:3001/auth/refresh', {
      method: 'POST',
      body: {
        refresh_token: 'old-refresh-token'
      }
    })

    expect(result).toEqual(mockResponse)
    expect(pending.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('should clear error', async () => {
    const { useAuth } = await import('~/composables/useAuth')
    const { clearError, error } = useAuth()
    
    // Manually set error to test clearing
    error.value = 'Test error'
    expect(error.value).toBe('Test error')
    
    clearError()
    expect(error.value).toBeNull()
  })
})