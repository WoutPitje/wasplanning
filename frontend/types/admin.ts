import type { Tenant, User, UserRole } from './auth'

export interface CreateTenantDto {
  name: string
  display_name: string
  logo_url?: string
  admin_email: string
  admin_first_name: string
  admin_last_name: string
}

export interface UpdateTenantDto {
  display_name?: string
  logo_url?: string
  is_active?: boolean
  settings?: Record<string, any>
}

export interface CreateTenantResponse {
  tenant: Tenant
  admin_user: {
    id: string
    email: string
    first_name: string
    last_name: string
    temporary_password: string
  }
  instructions: string
}

export interface TenantWithUsers extends Tenant {
  users: Omit<User, 'password'>[]
}

export interface TenantStats {
  tenant_id: string
  tenant_name: string
  total_users: number
  active_users: number
  users_by_role: Record<UserRole, number>
  created_at: string
  last_updated: string
}