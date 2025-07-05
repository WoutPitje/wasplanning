export interface LoginDto {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  user: User
  impersonation?: {
    is_impersonating: boolean
    impersonator_id: string
    impersonator_email: string
  }
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
  last_login: string | null
  tenant: Tenant
}

export interface Tenant {
  id: string
  name: string
  display_name: string
  logo_url: string | null
  language: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export enum UserRole {
  WERKPLAATS = 'workshop',
  WASSERS = 'washers',
  HAAL_BRENG_PLANNERS = 'pickup_delivery_planners',
  WASPLANNERS = 'wash_planners',
  GARAGE_ADMIN = 'garage_admin',
  SUPER_ADMIN = 'super_admin'
}

export interface RefreshTokenDto {
  refresh_token: string
}

export interface ApiError {
  statusCode: number
  message: string | string[]
  error: string
}