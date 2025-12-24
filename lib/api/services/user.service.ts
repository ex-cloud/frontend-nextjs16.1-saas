import { api } from '../client'
import type {
  User,
  PaginatedResponse,
  ApiResponse,
  UserFilters,
  CreateUserInput,
  UpdateUserInput,
  ActivityLog,
  UserStats,
  ChangePasswordInput,
} from '@/types/user'
import type { Permission } from '@/types/permission'

const USERS_ENDPOINT = '/users'

export const userService = {
  /**
   * Get paginated list of users with filters
   * Maps frontend filters to Spatie QueryBuilder format
   */
  getUsers: async (filters?: UserFilters): Promise<PaginatedResponse<User>> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Map filter parameters to Spatie QueryBuilder format
          if (key === 'search' || key === 'role' || key === 'is_active' || key === 'email_verified') {
            params.append(`filter[${key}]`, String(value))
          } else if (key === 'sort_by') {
            // Map sort_by to Spatie's sort parameter
            const sortOrder = filters.sort_order || 'asc'
            const sortValue = sortOrder === 'desc' ? `-${value}` : value
            params.append('sort', sortValue)
          } else if (key !== 'sort_order') {
            // Other parameters (page, per_page) pass directly
            params.append(key, String(value))
          }
        }
      })
    }

    try {
      const response = await api.get<PaginatedResponse<User>>(
        `${USERS_ENDPOINT}?${params.toString()}`
      )
      console.log('userService.getUsers RAW response:', response);
      console.log('userService.getUsers response.data:', response.data);
      return response.data
    } catch (error) {
      console.error('userService.getUsers ERROR:', error);
      throw error;
    }
  },

  /**
   * Get single user by ID
   */
  getUser: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`)
    return response.data.data
  },

  /**
   * Create new user
   */
  createUser: async (data: CreateUserInput): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(USERS_ENDPOINT, data)
    return response.data.data
  },

  /**
   * Update existing user
   */
  updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
    const response = await api.put<ApiResponse<User>>(`${USERS_ENDPOINT}/${id}`, data)
    return response.data.data
  },

  /**
   * Delete user (soft delete)
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`${USERS_ENDPOINT}/${id}`)
  },

  /**
   * Bulk delete users
   */
  bulkDeleteUsers: async (ids: string[]): Promise<void> => {
    await api.post(`${USERS_ENDPOINT}/bulk-delete`, { ids })
  },

  /**
   * Activate user
   */
  activateUser: async (id: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(
      `${USERS_ENDPOINT}/${id}/activate`
    )
    return response.data.data
  },

  /**
   * Deactivate user
   */
  deactivateUser: async (id: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(
      `${USERS_ENDPOINT}/${id}/deactivate`
    )
    return response.data.data
  },

  /**
   * Bulk activate users
   */
  bulkActivateUsers: async (ids: string[]): Promise<void> => {
    await api.post(`${USERS_ENDPOINT}/bulk-activate`, { ids })
  },

  /**
   * Bulk deactivate users
   */
  bulkDeactivateUsers: async (ids: string[]): Promise<void> => {
    await api.post(`${USERS_ENDPOINT}/bulk-deactivate`, { ids })
  },

  /**
   * Verify user email
   */
  verifyEmail: async (id: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>(
      `${USERS_ENDPOINT}/${id}/verify-email`
    )
    return response.data.data
  },

  /**
   * Send password reset email
   */
  sendPasswordReset: async (id: string): Promise<void> => {
    await api.post(`${USERS_ENDPOINT}/${id}/send-password-reset`)
  },

  /**
   * Get user permissions
   */
  getUserPermissions: async (id: string): Promise<Permission[]> => {
    const response = await api.get<ApiResponse<Permission[]>>(
      `${USERS_ENDPOINT}/${id}/permissions`
    )
    return response.data.data
  },

  /**
   * Get user activity logs
   */
  getUserActivities: async (id: string, page = 1, perPage = 20): Promise<PaginatedResponse<ActivityLog>> => {
    const response = await api.get<PaginatedResponse<ActivityLog>>(
      `${USERS_ENDPOINT}/${id}/activities?page=${page}&per_page=${perPage}`
    )
    return response.data
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStats> => {
    const response = await api.get<ApiResponse<UserStats>>(`${USERS_ENDPOINT}/stats`)
    return response.data.data
  },

  /**
   * Export users to CSV
   */
  exportUsers: async (filters?: UserFilters): Promise<Blob> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await api.get(`${USERS_ENDPOINT}/export?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data as Blob
  },

  /**
   * Upload user avatar
   */
  uploadAvatar: async (id: string, file: File): Promise<User> => {
    console.log('userService.uploadAvatar called', { id, file, fileName: file.name, fileSize: file.size })
    
    const formData = new FormData()
    formData.append('avatar', file)

    console.log('FormData created, making API call to:', `${USERS_ENDPOINT}/${id}/upload-avatar`)

    const response = await api.post<ApiResponse<User>>(
      `${USERS_ENDPOINT}/${id}/upload-avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    
    console.log('Avatar upload response:', response.data)
    return response.data.data
  },

  /**
   * Delete user avatar
   */
  deleteAvatar: async (id: string): Promise<User> => {
    const response = await api.delete<ApiResponse<User>>(
      `${USERS_ENDPOINT}/${id}/delete-avatar`
    )
    return response.data.data
  },

  /**
   * Change user password
   */
  changePassword: async (id: string, data: ChangePasswordInput): Promise<void> => {
    const response = await api.post<ApiResponse<void>>(
      `${USERS_ENDPOINT}/${id}/change-password`,
      data
    )
    return response.data.data
  },
}

export default userService
