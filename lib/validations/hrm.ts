/**
 * HRM Module Zod Validation Schemas
 * 
 * These schemas match exactly with Laravel backend validation rules:
 * - StoreDepartmentRequest.php
 * - StorePositionRequest.php
 * - StoreTeamRequest.php
 * - TeamMemberController validation
 * 
 * @see lara12-rest-api/app/Http/Requests/
 */

import { z } from 'zod';

// ============================================================================
// Department Validation Schemas
// ============================================================================

/**
 * Department Create/Update Schema
 * Synced with: StoreDepartmentRequest.php & UpdateDepartmentRequest.php
 */
export const departmentSchema = z.object({
  // Required fields
  name: z
    .string({ message: 'Department name is required' })
    .min(1, 'Department name is required')
    .max(255, 'Department name must not exceed 255 characters')
    .trim(),
  
  code: z
    .string({ message: 'Department code is required' })
    .min(1, 'Department code is required')
    .max(50, 'Department code must not exceed 50 characters')
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Department code must only contain uppercase letters, numbers, hyphens, and underscores'),
  
  // Optional fields
  description: z
    .string()
    .trim()
    .optional()
    .nullable(),
  
  manager_id: z
    .number({ message: 'Manager must be a valid user' })
    .int('Manager must be a valid user')
    .positive('Manager must be a valid user')
    .optional()
    .nullable(),
  
  parent_id: z
    .number({ message: 'Parent department must be valid' })
    .int('Parent department must be valid')
    .positive('Parent department must be valid')
    .optional()
    .nullable(),
  
  budget_allocated: z
    .number()
    .nonnegative('Budget must be a positive number')
    .optional()
    .nullable(),
  
  location: z
    .string()
    .max(255, 'Location must not exceed 255 characters')
    .trim()
    .optional()
    .nullable(),
  
  is_active: z
    .boolean({ message: 'Active status must be true or false' }),
}).superRefine((data, ctx) => {
  // Custom validation: prevent self-parent reference
  if (data.parent_id && data.parent_id === (data as { id?: number }).id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A department cannot be its own parent',
      path: ['parent_id'],
    });
  }
});

/**
 * Department Filter Schema
 */
export const departmentFilterSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  has_manager: z.boolean().optional(),
  parent_id: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(15),
  sort_by: z.enum(['name', 'code', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Position Validation Schemas
// ============================================================================

/**
 * Position Levels (sync with backend)
 */
export const BACKEND_POSITION_LEVELS = [
  'c-level',
  'vp',
  'director',
  'manager',
  'senior',
  'mid-level',
  'junior',
  'entry-level',
] as const;

/**
 * Position Create/Update Schema
 * Synced with: StorePositionRequest.php & UpdatePositionRequest.php
 */
export const positionSchema = z.object({
  // Required fields
  name: z
    .string({ message: 'Position name is required' })
    .min(1, 'Position name is required')
    .max(255, 'Position name must not exceed 255 characters')
    .trim(),
  
  code: z
    .string({ message: 'Position code is required' })
    .min(1, 'Position code is required')
    .max(50, 'Position code must not exceed 50 characters')
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Position code must only contain uppercase letters, numbers, hyphens, and underscores'),
  
  level: z
    .enum(BACKEND_POSITION_LEVELS, {
      message: 'Position level is required',
    }),
  
  // Optional fields
  description: z
    .string()
    .trim()
    .optional()
    .nullable(),
  
  department_id: z
    .number({ message: 'Department must be valid' })
    .int('Department must be valid')
    .positive('Department must be valid')
    .optional()
    .nullable(),
  
  salary_min: z
    .number()
    .nonnegative('Minimum salary must be a positive number')
    .optional()
    .nullable(),
  
  salary_max: z
    .number()
    .nonnegative('Maximum salary must be a positive number')
    .optional()
    .nullable(),
  
  salary_currency: z
    .string()
    .max(10, 'Salary currency must not exceed 10 characters')
    .trim(),
  
  required_skills: z
    .array(
      z.string().max(100, 'Skill name must not exceed 100 characters')
    )
    .optional()
    .nullable(),
  
  is_active: z
    .boolean({ message: 'Active status must be true or false' }),
}).superRefine((data, ctx) => {
  // Custom validation: salary_max must be >= salary_min
  if (
    data.salary_min !== null &&
    data.salary_min !== undefined &&
    data.salary_max !== null &&
    data.salary_max !== undefined &&
    data.salary_max < data.salary_min
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Maximum salary must be greater than or equal to minimum salary',
      path: ['salary_max'],
    });
  }
});

/**
 * Position Filter Schema
 */
export const positionFilterSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  department_id: z.number().int().positive().optional(),
  level: z.enum(BACKEND_POSITION_LEVELS).optional(),
  min_salary: z.number().nonnegative().optional(),
  max_salary: z.number().nonnegative().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(15),
  sort_by: z.enum(['name', 'code', 'level', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Team Validation Schemas
// ============================================================================

/**
 * Team Types (sync with backend)
 */
export const BACKEND_TEAM_TYPES = ['permanent', 'project', 'cross_functional'] as const;

/**
 * Team Statuses (sync with backend)
 */
export const BACKEND_TEAM_STATUSES = ['active', 'inactive', 'completed', 'on_hold'] as const;

/**
 * Team Create/Update Schema
 * Synced with: StoreTeamRequest.php & UpdateTeamRequest.php
 */
export const teamSchema = z.object({
  // Required fields
  name: z
    .string({ message: 'Team name is required' })
    .min(1, 'Team name is required')
    .max(255, 'Team name must not exceed 255 characters')
    .trim(),
  
  code: z
    .string({ message: 'Team code is required' })
    .min(1, 'Team code is required')
    .max(50, 'Team code must not exceed 50 characters')
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]+$/, 'Team code must only contain uppercase letters, numbers, hyphens, and underscores'),
  
  team_type: z
    .enum(BACKEND_TEAM_TYPES, {
      message: 'Team type is required',
    }),
  
  status: z
    .enum(BACKEND_TEAM_STATUSES, {
      message: 'Team status is required',
    }),
  
  // Optional fields
  description: z
    .string()
    .trim()
    .optional()
    .nullable(),
  
  team_lead_id: z
    .number({ message: 'Team lead must be a valid user' })
    .int('Team lead must be a valid user')
    .positive('Team lead must be a valid user')
    .optional()
    .nullable(),
  
  department_id: z
    .number({ message: 'Department must be valid' })
    .int('Department must be valid')
    .positive('Department must be valid')
    .optional()
    .nullable(),
  
  max_members: z
    .number({ message: 'Maximum members must be a number' })
    .int('Maximum members must be a whole number')
    .min(1, 'Maximum members must be at least 1')
    .max(100, 'Maximum members cannot exceed 100')
    .optional()
    .nullable(),
  
  start_date: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
  
  end_date: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
}).superRefine((data, ctx) => {
  // Custom validation: end_date must be after or equal to start_date
  if (
    data.start_date &&
    data.end_date &&
    new Date(data.end_date) < new Date(data.start_date)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date must be after or equal to start date',
      path: ['end_date'],
    });
  }
});

/**
 * Team Filter Schema
 */
export const teamFilterSchema = z.object({
  search: z.string().optional(),
  team_type: z.enum(BACKEND_TEAM_TYPES).optional(),
  status: z.enum(BACKEND_TEAM_STATUSES).optional(),
  department_id: z.number().int().positive().optional(),
  team_lead_id: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  per_page: z.number().int().positive().max(100).default(15),
  sort_by: z.enum(['name', 'code', 'team_type', 'status', 'created_at', 'updated_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================================================
// Team Member Validation Schemas
// ============================================================================

/**
 * Team Member Roles (common values)
 */
export const BACKEND_TEAM_MEMBER_ROLES = [
  'Member',
  'Coordinator',
  'Lead',
  'Specialist',
] as const;

/**
 * Team Member Add Schema
 * Synced with: TeamMemberController validation
 */
export const teamMemberSchema = z.object({
  user_id: z
    .number({ message: 'User is required' })
    .int('User must be valid')
    .positive('User must be valid'),
  
  role_in_team: z
    .string()
    .max(100, 'Role must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
  
  joined_at: z
    .union([z.string(), z.date()])
    .optional()
    .nullable(),
});

/**
 * Team Member Update Schema
 */
export const teamMemberUpdateSchema = z.object({
  role_in_team: z
    .string()
    .max(100, 'Role must not exceed 100 characters')
    .trim()
    .optional()
    .nullable(),
});

// ============================================================================
// Form Validation Helpers
// ============================================================================

/**
 * Type inference helpers
 */
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type PositionFormData = z.infer<typeof positionSchema>;
export type TeamFormData = z.infer<typeof teamSchema>;
export type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

/**
 * Validate form data and return errors
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }
  
  // Transform Zod errors to field errors
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue: z.ZodIssue) => {
    const field = issue.path.join('.');
    errors[field] = issue.message;
  });
  
  return {
    success: false,
    errors,
  };
}

/**
 * Get field error message
 */
export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}

/**
 * Check if field has error
 */
export function hasFieldError(
  errors: Record<string, string> | undefined,
  field: string
): boolean {
  return !!errors?.[field];
}

// ============================================================================
// Validation Presets
// ============================================================================

/**
 * Common string validations
 */
export const commonValidations = {
  required: z.string().min(1, 'This field is required'),
  email: z.string().email('Invalid email address'),
  url: z.string().url('Invalid URL'),
  phone: z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonNegativeNumber: z.number().nonnegative('Must be a non-negative number'),
};

/**
 * Transform helper for select inputs (number values)
 */
export const selectNumberTransform = z
  .union([z.number(), z.string()])
  .transform((val: number | string) => (typeof val === 'string' ? parseInt(val, 10) : val))
  .pipe(z.number());

/**
 * Transform helper for checkbox/switch inputs
 */
export const booleanTransform = z
  .union([z.boolean(), z.string()])
  .transform((val: boolean | string) => {
    if (typeof val === 'string') {
      return val === 'true' || val === '1' || val === 'yes';
    }
    return val;
  })
  .pipe(z.boolean());
