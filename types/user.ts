// Types matching Laravel backend UserResource
export interface UserProfile {
  id: string
  user_id: string
  gender?: 'male' | 'female' | 'other'
  mobile?: string
  birth_date?: string // YYYY-MM-DD format
  location?: string
  interests?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  name: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email: string
  language?: string
  time_zone?: string
  phone?: string
  email_verified_at: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  roles: Role[]
  permissions: Permission[]
  avatar_url?: string
  profile?: UserProfile | null
  
  // HRM Fields
  department_id?: string | number | null
  position_id?: string | number | null
  department?: { id: string | number; name: string; code: string } | null
  position?: { id: string | number; name: string; code: string; level: string } | null
  employee_number?: string | null
  join_date?: string | null
  probation_end_date?: string | null
  direct_manager_id?: string | number | null
  direct_manager?: User | null
}

export interface Role {
  id: string
  name: string
  guard_name: string
  created_at: string
  updated_at: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  name: string
  guard_name: string
  created_at: string
  updated_at: string
}

// API Response types
export interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success?: boolean
  meta?: PaginationMeta
  links?: PaginationLinks
}

export interface PaginatedResponse<T> {
  data: T[]
  links: PaginationLinks
  meta: PaginationMeta
  success?: boolean
  message?: string
}

// Request types
export interface UserFilters {
  search?: string
  role?: string
  is_active?: boolean
  email_verified?: boolean
  sort_by?: 'username' | 'name' | 'email' | 'created_at' | 'last_login_at'
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface CreateUserInput {
  username: string
  name: string
  email: string
  password: string
  password_confirmation: string
  roles?: string[] // Role IDs
  is_active?: boolean
  avatar?: File | null
  
  // HRM Fields
  department_id?: string | number | null
  position_id?: string | number | null
  employee_number?: string | null
  join_date?: string | null
  probation_end_date?: string | null
  direct_manager_id?: string | number | null
}

export interface UpdateUserInput {
  username?: string
  name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  email?: string
  language?: string
  time_zone?: string
  phone?: string
  password?: string
  password_confirmation?: string
  roles?: string[] // Role IDs
  is_active?: boolean
  avatar?: File | null
  avatar_removed?: boolean
  
  // HRM Fields
  department_id?: string | number | null
  position_id?: string | number | null
  employee_number?: string | null
  join_date?: string | null
  probation_end_date?: string | null
  direct_manager_id?: string | number | null
  
  // Profile fields
  gender?: string
  mobile?: string
  birth_date?: string
  location?: string
  interests?: string
  bio?: string
}

// Form types for React Hook Form
export interface UserFormData {
  username: string
  name: string
  email: string
  password?: string
  password_confirmation?: string
  roles: string[]
  is_active: boolean
  
  // HRM Fields
  department_id?: string | number | null
  position_id?: string | number | null
  employee_number?: string | null
  join_date?: string | null
  probation_end_date?: string | null
  direct_manager_id?: string | number | null
}

// Password Change Input
export interface ChangePasswordInput {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

// Activity Log type
export interface ActivityLog {
  id: string
  log_name: string
  description: string
  subject_type: string
  subject_id: string
  causer_type: string
  causer_id: string
  properties: Record<string, unknown>
  created_at: string
  causer?: User
}

// User Statistics
export interface UserStats {
  total_users: number
  active_users: number
  inactive_users: number
  verified_users: number
  unverified_users: number
  users_by_role: Array<{
    role: string
    count: number
  }>
}
