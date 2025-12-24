export interface Permission {
  id: string
  name: string
  guard_name: string
  created_at: string
  updated_at: string
}

export interface PermissionsByModule {
  [module: string]: Permission[]
}

export interface PaginatedPermissions {
  data: Permission[]
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}
