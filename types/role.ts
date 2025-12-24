import { Permission } from './permission'

export interface Role {
  id: string
  name: string
  guard_name: string
  created_at: string
  updated_at: string
  permissions?: Permission[]
  permissions_count?: number
}

export interface RoleQueryParams {
  page?: number
  per_page?: number
  'filter[name]'?: string
  sort?: string
}

export interface PaginatedRoles {
  data: Role[]
  meta: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

export interface CreateRoleInput {
  name: string
  permissions?: string[]
}

export interface UpdateRoleInput {
  name?: string
  permissions?: string[]
}
