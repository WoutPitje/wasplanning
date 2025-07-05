import type { LocationQuery } from 'vue-router'

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export interface QueryFilterOptions {
  debounceMs?: number
  removeEmpty?: boolean
}

export interface FilterState {
  search?: string
  role?: string
  tenant?: string
  status?: string
  page?: number
  sort?: string
  order?: 'asc' | 'desc'
  [key: string]: any
}

export const useQueryFilters = <T extends FilterState>(
  defaultFilters: T,
  options: QueryFilterOptions = {}
) => {
  const { debounceMs = 300, removeEmpty = true } = options
  const route = useRoute()
  const router = useRouter()

  // Initialize filters from query parameters
  const filters = reactive<T>({ ...defaultFilters })

  // Parse query parameters on mount
  const initializeFromQuery = () => {
    const query = route.query
    
    Object.keys(defaultFilters).forEach((key) => {
      if (query[key] !== undefined) {
        const value = query[key]
        
        // Handle different types
        if (key === 'page' && typeof value === 'string') {
          filters[key] = parseInt(value, 10)
        } else if (typeof defaultFilters[key] === 'boolean' && typeof value === 'string') {
          filters[key] = value === 'true'
        } else {
          filters[key] = value as any
        }
      }
    })
  }

  // Update URL query parameters
  const updateQuery = (newFilters: Partial<T>) => {
    const query: LocationQuery = {}
    
    Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
      // Skip empty values if removeEmpty is true
      if (removeEmpty && (value === '' || value === null || value === undefined)) {
        return
      }
      
      // Skip default values to keep URL clean
      if (value === defaultFilters[key]) {
        return
      }
      
      // Convert to string for query params
      if (value !== undefined && value !== null) {
        query[key] = String(value)
      }
    })
    
    // Update route without triggering navigation
    router.replace({ query })
  }

  // Debounced update for search input
  const debouncedUpdateQuery = debounce(updateQuery, debounceMs)

  // Watch individual filter changes
  const watchFilter = (key: keyof T, immediate = false) => {
    watch(
      () => filters[key],
      (newValue) => {
        if (key === 'search') {
          debouncedUpdateQuery({ [key]: newValue } as Partial<T>)
        } else {
          updateQuery({ [key]: newValue } as Partial<T>)
        }
      },
      { immediate }
    )
  }

  // Watch all filters
  const watchAllFilters = () => {
    Object.keys(filters).forEach((key) => {
      watchFilter(key as keyof T)
    })
  }

  // Reset filters to defaults
  const resetFilters = () => {
    Object.assign(filters, defaultFilters)
    router.replace({ query: {} })
  }

  // Update a single filter
  const updateFilter = (key: keyof T, value: T[keyof T]) => {
    filters[key] = value
  }

  // Update multiple filters at once
  const updateFilters = (updates: Partial<T>) => {
    Object.assign(filters, updates)
    updateQuery(updates)
  }

  // Initialize on mount
  onMounted(() => {
    initializeFromQuery()
    watchAllFilters()
  })

  return {
    filters: readonly(filters),
    updateFilter,
    updateFilters,
    resetFilters,
    initializeFromQuery,
  }
}