export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string | null
  action: string
  resource_type: string
  resource_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  user?: {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
  }
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  user_id?: string
  action?: string
  resource_type?: string
  start_date?: string
  end_date?: string
  sort?: 'created_at' | 'action' | 'resource_type'
  order?: 'ASC' | 'DESC'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}