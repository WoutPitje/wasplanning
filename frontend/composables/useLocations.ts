import type { 
  CreateLocationDto, 
  UpdateLocationDto, 
  LocationResponseDto,
  AssignUsersDto,
  LocationFilters,
  LocationWithUsers
} from '~/types/locations'
import type { PaginatedResponse } from '~/types/users'

export const useLocations = () => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()
  
  // State management
  const pending = ref(false)
  const error = ref<string | null>(null)
  
  // Get authorization header
  const getAuthHeader = () => ({
    Authorization: `Bearer ${authStore.accessToken}`
  })
  
  // Get all locations with pagination
  const getLocations = async (filters?: LocationFilters): Promise<LocationResponseDto[]> => {
    try {
      pending.value = true
      error.value = null
      
      const queryParams = new URLSearchParams()
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.active !== undefined) queryParams.append('active', String(filters.active))
      if (filters?.page) queryParams.append('page', String(filters.page))
      if (filters?.limit) queryParams.append('limit', String(filters.limit))
      
      const response = await $fetch<LocationResponseDto[]>(
        `${config.public.apiUrl}/locations${queryParams.toString() ? `?${queryParams}` : ''}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch locations'
      throw err
    } finally {
      pending.value = false
    }
  }
  
  // Get single location
  const getLocation = async (id: string): Promise<LocationResponseDto | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<LocationResponseDto>(
        `${config.public.apiUrl}/locations/${id}`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch location'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Create location
  const createLocation = async (data: CreateLocationDto): Promise<LocationResponseDto | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<LocationResponseDto>(
        `${config.public.apiUrl}/locations`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to create location'
      throw err
    } finally {
      pending.value = false
    }
  }
  
  // Update location
  const updateLocation = async (id: string, data: UpdateLocationDto): Promise<LocationResponseDto | null> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<LocationResponseDto>(
        `${config.public.apiUrl}/locations/${id}`,
        {
          method: 'PATCH',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to update location'
      return null
    } finally {
      pending.value = false
    }
  }
  
  // Delete location (soft delete)
  const deleteLocation = async (id: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/locations/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to delete location'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Assign users to location
  const assignUsersToLocation = async (locationId: string, userIds: string[]): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      const data: AssignUsersDto = { user_ids: userIds }
      
      await $fetch(
        `${config.public.apiUrl}/locations/${locationId}/users`,
        {
          method: 'POST',
          headers: getAuthHeader(),
          body: data
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to assign users'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Remove user from location
  const removeUserFromLocation = async (locationId: string, userId: string): Promise<boolean> => {
    try {
      pending.value = true
      error.value = null
      
      await $fetch(
        `${config.public.apiUrl}/locations/${locationId}/users/${userId}`,
        {
          method: 'DELETE',
          headers: getAuthHeader()
        }
      )
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to remove user'
      return false
    } finally {
      pending.value = false
    }
  }
  
  // Get location with users
  const getLocationUsers = async (locationId: string): Promise<any[]> => {
    try {
      pending.value = true
      error.value = null
      
      const response = await $fetch<any[]>(
        `${config.public.apiUrl}/locations/${locationId}/users`,
        {
          method: 'GET',
          headers: getAuthHeader()
        }
      )
      
      return response
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to fetch location users'
      return []
    } finally {
      pending.value = false
    }
  }
  
  return {
    // State
    pending: readonly(pending),
    error: readonly(error),
    
    // Methods
    getLocations,
    getLocation,
    createLocation,
    updateLocation,
    deleteLocation,
    assignUsersToLocation,
    removeUserFromLocation,
    getLocationUsers,
    
    // Utils
    clearError: () => { error.value = null }
  }
}