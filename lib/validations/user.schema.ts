import { z } from 'zod'

// User creation schema
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  phone: z
    .string()
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Please provide a valid phone number format')
    .optional()
    .or(z.literal('')),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)'),
  
  password_confirmation: z.string(),
  
  roles: z
    .array(z.string())
    .min(1, 'At least one role is required'),
  
  is_active: z.boolean().default(true),
  
  avatar: z.any().optional().nullable(),
  
  // HRM Fields
  department_id: z.union([z.string(), z.number()]).optional().nullable(),
  position_id: z.union([z.string(), z.number()]).optional().nullable(),
  employee_number: z.string().max(50).optional().nullable(),
  join_date: z.union([z.string(), z.date()]).optional().nullable(),
  probation_end_date: z.union([z.string(), z.date()]).optional().nullable(),
  direct_manager_id: z.union([z.string(), z.number()]).optional().nullable(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
})

// User update schema (password optional, other required fields same as create)
export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  phone: z
    .string()
    .max(20, 'Phone number must not exceed 20 characters')
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/, 'Please provide a valid phone number format')
    .optional()
    .or(z.literal('')),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)')
    .optional()
    .or(z.literal('')),
  
  password_confirmation: z.string().optional().or(z.literal('')),
  
  roles: z
    .array(z.string())
    .min(1, 'At least one role is required'),
  
  is_active: z.boolean(),
  
  avatar: z.any().optional().nullable(),
  avatar_removed: z.boolean().optional(),
  
  // HRM Fields
  department_id: z.union([z.string(), z.number()]).optional().nullable(),
  position_id: z.union([z.string(), z.number()]).optional().nullable(),
  employee_number: z.string().max(50).optional().nullable(),
  join_date: z.union([z.string(), z.date()]).optional().nullable(),
  probation_end_date: z.union([z.string(), z.date()]).optional().nullable(),
  direct_manager_id: z.union([z.string(), z.number()]).optional().nullable(),
}).refine(
  (data) => {
    // If password is provided, password_confirmation must match
    if (data.password && data.password !== '') {
      return data.password === data.password_confirmation
    }
    return true
  },
  {
    message: "Passwords don't match",
    path: ['password_confirmation'],
  }
)

// User filters schema
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  is_active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
  sort_by: z.enum(['username', 'name', 'email', 'created_at', 'last_login_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
})

// Bulk action schema
export const bulkActionSchema = z.object({
  action: z.enum(['delete', 'activate', 'deactivate', 'verify_email']),
  user_ids: z.array(z.string()).min(1, 'Select at least one user'),
})

// Export types from schemas
export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type UserFiltersFormData = z.infer<typeof userFiltersSchema>
export type BulkActionFormData = z.infer<typeof bulkActionSchema>
