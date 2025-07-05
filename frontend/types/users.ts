import type { User, UserRole } from './auth'

export interface CreateUserDto {
  email: string
  password?: string
  first_name: string
  last_name: string
  role: UserRole
  tenant_id: string
  is_active?: boolean
}

export interface UpdateUserDto {
  first_name?: string
  last_name?: string
  role?: UserRole
  is_active?: boolean
}

export interface ResetPasswordDto {
  new_password: string
}

export interface CreateUserResponse {
  user: Omit<User, 'password'>
  temporary_password?: string
  message: string
}

export interface UserFilters {
  tenant_id?: string
  role?: UserRole
  is_active?: boolean
  search?: string
}

export interface UserWithoutPassword extends Omit<User, 'password'> {
  created_at?: string
  updated_at?: string
}