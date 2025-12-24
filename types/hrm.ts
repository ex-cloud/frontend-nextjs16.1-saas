/**
 * HRM Module TypeScript Types
 * 
 * These types are synchronized with Laravel backend models:
 * - Department.php
 * - Position.php
 * - Team.php
 * - TeamMember.php
 * - DepartmentUserHistory.php
 * 
 * @see lara12-rest-api/app/Models/
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * Base User type for HRM relationships
 */
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
  department_id?: number | null;
  position_id?: number | null;
  employee_number?: string | null;
  join_date?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relationships
  position?: Position;
  department?: Department;
}

// ============================================================================
// Department Types
// ============================================================================

/**
 * Department Model
 * Synced with: lara12-rest-api/app/Models/Department.php
 */
export interface Department {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  manager_id?: number | null;
  parent_id?: number | null;
  budget_allocated?: string | null; // decimal as string
  location?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // Relationships (optional, loaded when eager loaded)
  manager?: User;
  parent?: Department;
  children?: Department[];
  users?: User[];
  positions?: Position[];
  teams?: Team[];
  users_count?: number;
  positions_count?: number;
  teams_count?: number;
}

/**
 * Department Tree Node (for hierarchical views)
 */
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[];
  level?: number;
  employees_count?: number;
}

/**
 * Department Form Input (for create/update)
 */
export interface DepartmentInput {
  name: string;
  code: string;
  description?: string;
  manager_id?: number | null;
  parent_id?: number | null;
  budget_allocated?: number | string | null;
  location?: string;
  is_active?: boolean;
}

// ============================================================================
// Position Types
// ============================================================================

/**
 * Position Model
 * Synced with: lara12-rest-api/app/Models/Position.php
 */
export interface Position {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  department_id?: number | null;
  level?: string | null; // e.g., 'Junior', 'Senior', 'Lead', 'Manager'
  salary_min?: string | null; // decimal as string
  salary_max?: string | null; // decimal as string
  salary_currency: string; // default 'IDR'
  required_skills?: string[] | null; // JSON array
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // Relationships
  department?: Department;
  users?: User[];
  users_count?: number;
  
  // Computed
  salary_range?: string; // formatted salary range
}

/**
 * Position Form Input
 */
export interface PositionInput {
  name: string;
  code: string;
  description?: string;
  department_id?: number | null;
  level?: string;
  salary_min?: number | string | null;
  salary_max?: number | string | null;
  salary_currency?: string;
  required_skills?: string[];
  is_active?: boolean;
}

/**
 * Position Levels (common values)
 */
export const POSITION_LEVELS = [
  'c-level',
  'vp',
  'director',
  'manager',
  'senior',
  'mid-level',
  'junior',
  'entry-level',
] as const;

export type PositionLevel = typeof POSITION_LEVELS[number];

/**
 * Position Levels for UI selects (with labels)
 */
export const POSITION_LEVEL_OPTIONS = [
  { value: 'c-level', label: 'C-Level' },
  { value: 'vp', label: 'VP' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'senior', label: 'Senior' },
  { value: 'mid-level', label: 'Mid-Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'entry-level', label: 'Entry-Level' },
] as const;

// ============================================================================
// Team Types
// ============================================================================

/**
 * Team Model
 * Synced with: lara12-rest-api/app/Models/Team.php
 */
export interface Team {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  team_lead_id?: number | null;
  department_id?: number | null;
  team_type: TeamType;
  max_members?: number | null;
  status: TeamStatus;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  
  // Relationships
  team_lead?: User;
  department?: Department;
  team_members?: TeamMember[];
  users?: User[]; // through team_members pivot
  active_members_count?: number;
  members_count?: number;
}

/**
 * Team Form Input
 */
export interface TeamInput {
  name: string;
  code: string;
  description?: string;
  team_lead_id?: number | null;
  department_id?: number | null;
  team_type: TeamType;
  max_members?: number | null;
  status?: TeamStatus;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Team Types
 */
export const TEAM_TYPES = ['permanent', 'project', 'cross_functional'] as const;
export type TeamType = typeof TEAM_TYPES[number];

/**
 * Team Types for UI selects (with labels)
 */
export const TEAM_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'project', label: 'Project' },
  { value: 'cross_functional', label: 'Cross Functional' },
] as const;

/**
 * Team Status
 */
export const TEAM_STATUSES = ['active', 'inactive', 'completed', 'on_hold'] as const;
export type TeamStatus = typeof TEAM_STATUSES[number];

/**
 * Team Status for UI selects (with labels)
 */
export const TEAM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'completed', label: 'Completed' },
  { value: 'on_hold', label: 'On Hold' },
] as const;

// ============================================================================
// Team Member Types
// ============================================================================

/**
 * Team Member Model
 * Synced with: lara12-rest-api/app/Models/TeamMember.php
 */
export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role_in_team?: string | null; // e.g., 'Member', 'Coordinator', 'Lead'
  joined_at: string;
  left_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Relationships
  team?: Team;
  user?: User;
  
  // Computed
  is_active?: boolean;
  duration?: string;
}

/**
 * Team Member Form Input
 */
export interface TeamMemberInput {
  user_id: number;
  role_in_team?: string;
  joined_at?: string;
}

/**
 * Common Team Member Roles
 */
export const TEAM_MEMBER_ROLES = [
  'Member',
  'Coordinator',
  'Lead',
  'Specialist',
] as const;

export type TeamMemberRole = typeof TEAM_MEMBER_ROLES[number];

// ============================================================================
// Department User History Types
// ============================================================================

/**
 * Department User History Model (Transfer tracking)
 * Synced with: lara12-rest-api/app/Models/DepartmentUserHistory.php
 */
export interface DepartmentUserHistory {
  id: number;
  user_id: number;
  department_id: number;
  position_id?: number | null;
  effective_date: string;
  end_date?: string | null;
  reason?: string | null; // e.g., 'promotion', 'transfer', 'restructure'
  created_at: string;
  updated_at: string;
  
  // Relationships
  user?: User;
  department?: Department;
  position?: Position;
  
  // Computed
  is_current?: boolean;
}

/**
 * Transfer/Assignment reasons
 */
export const TRANSFER_REASONS = [
  'new_hire',
  'promotion',
  'transfer',
  'restructure',
  'demotion',
  'other',
] as const;

export type TransferReason = typeof TRANSFER_REASONS[number];

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard Laravel Pagination Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

/**
 * Single Resource Response
 */
export interface SingleResponse<T> {
  data: T;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>; // Validation errors
  error?: string; // General error
  exception?: string; // Exception class
  file?: string;
  line?: number;
  trace?: unknown[];
}

/**
 * Success Response (for delete, restore, etc.)
 */
export interface SuccessResponse {
  message: string;
  data?: unknown;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

/**
 * Department List Filters
 */
export interface DepartmentFilters {
  search?: string;
  is_active?: boolean | null;
  has_manager?: boolean;
  parent_id?: number | null;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'code' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Position List Filters
 */
export interface PositionFilters {
  search?: string;
  is_active?: boolean | null;
  department_id?: number | null;
  level?: string;
  min_salary?: number;
  max_salary?: number;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'code' | 'level' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

/**
 * Team List Filters
 */
export interface TeamFilters {
  search?: string;
  team_type?: TeamType;
  status?: TeamStatus;
  department_id?: number | null;
  team_lead_id?: number | null;
  page?: number;
  per_page?: number;
  sort_by?: 'name' | 'code' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// Form State Types
// ============================================================================

/**
 * Generic Form State
 */
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Modal State
 */
export interface ModalState<T = unknown> {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  data?: T;
}

// ============================================================================
// Permission Types
// ============================================================================

/**
 * HRM Permissions
 * Synced with: lara12-rest-api/database/seeders/RolePermissionSeeder.php
 */
export const HRM_PERMISSIONS = {
  // Department permissions
  VIEW_DEPARTMENTS: 'view_departments',
  CREATE_DEPARTMENTS: 'create_departments',
  EDIT_DEPARTMENTS: 'edit_departments',
  DELETE_DEPARTMENTS: 'delete_departments',
  RESTORE_DEPARTMENTS: 'restore_departments',
  
  // Position permissions
  VIEW_POSITIONS: 'view_positions',
  CREATE_POSITIONS: 'create_positions',
  EDIT_POSITIONS: 'edit_positions',
  DELETE_POSITIONS: 'delete_positions',
  RESTORE_POSITIONS: 'restore_positions',
  
  // Team permissions
  VIEW_TEAMS: 'view_teams',
  CREATE_TEAMS: 'create_teams',
  EDIT_TEAMS: 'edit_teams',
  DELETE_TEAMS: 'delete_teams',
  RESTORE_TEAMS: 'restore_teams',
  MANAGE_TEAM_MEMBERS: 'manage_team_members',
} as const;

export type HrmPermission = typeof HRM_PERMISSIONS[keyof typeof HRM_PERMISSIONS];

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Select Option (for dropdowns)
 */
export interface SelectOption<T = unknown> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
}

/**
 * Table Column Definition
 */
export interface TableColumn<T = unknown> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => React.ReactNode;
}

/**
 * Sort Configuration
 */
export interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}
