export interface Location {
  id: string
  name: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateLocationDto {
  name: string
  address?: string
}

export interface UpdateLocationDto {
  name?: string
  address?: string
}

export interface LocationResponseDto {
  id: string
  name: string
  address?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AssignUsersDto {
  user_ids: string[]
}

export interface LocationFilters {
  search?: string
  active?: boolean
  page?: number
  limit?: number
}

export interface LocationWithUsers extends Location {
  users?: {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }[]
}