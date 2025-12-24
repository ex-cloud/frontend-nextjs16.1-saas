import { api } from '@/lib/api/client'
import { Role, RoleQueryParams, PaginatedRoles, CreateRoleInput, UpdateRoleInput } from '@/types/role'

// Laravel Resource Collection Response Format
interface LaravelResourceCollection<T> {
  data: T
  meta?: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

// Standard API Response (for single resource operations)
interface ApiResponse<T> {
  success?: boolean
  message?: string
  data: T
}

const ROLES_ENDPOINT = '/roles'

export const roleService = {
  /**
   * Get all roles with optional filters
   */
  getRoles: async (params?: RoleQueryParams): Promise<PaginatedRoles> => {
    // Backend returns Laravel Resource Collection format: {data, meta, links}
    const response = await api.get<LaravelResourceCollection<Role[]>>(ROLES_ENDPOINT, {
      params: {
        ...params,
        per_page: params?.per_page || 100, // Get all roles by default
      }
    })
    
    // Response is already in correct format from Laravel Resource Collection
    return {
      data: response.data.data || [],
      meta: response.data.meta || {
        current_page: 1,
        from: null,
        last_page: 1,
        per_page: 100,
        to: null,
        total: 0
      },
      links: response.data.links || {
        first: null,
        last: null,
        prev: null,
        next: null
      }
    }
  },

  /**
   * Get single role by ID
   */
  getRole: async (id: string): Promise<Role> => {
    const response = await api.get<ApiResponse<Role>>(`${ROLES_ENDPOINT}/${id}`)
    return response.data.data
  },

  /**
   * Create new role
   */
  createRole: async (data: CreateRoleInput): Promise<Role> => {
    const response = await api.post<ApiResponse<Role>>(ROLES_ENDPOINT, data)
    return response.data.data
  },

  /**
   * Update existing role
   */
  updateRole: async (id: string, data: UpdateRoleInput): Promise<Role> => {
    const response = await api.put<ApiResponse<Role>>(`${ROLES_ENDPOINT}/${id}`, data)
    return response.data.data
  },

  /**
   * Delete role
   */
  deleteRole: async (id: string): Promise<void> => {
    await api.delete(`${ROLES_ENDPOINT}/${id}`)
  },
}
