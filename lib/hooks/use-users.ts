import { 
  useQuery, 
  useMutation, 
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import userService from '@/lib/api/services/user.service'
import type {
  User,
  PaginatedResponse,
  UserFilters,
  CreateUserInput,
  UpdateUserInput,
  ActivityLog,
  UserStats,
} from '@/types/user'
import type { Permission } from '@/types/permission'

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  permissions: (id: string) => [...userKeys.detail(id), 'permissions'] as const,
  activities: (id: string, page: number) => [...userKeys.detail(id), 'activities', page] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
}

/**
 * Hook to fetch paginated users list
 */
export function useUsers(
  filters?: UserFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<User>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getUsers(filters),
    staleTime: 30000, // 30 seconds
    ...options,
  })
}

/**
 * Hook to fetch single user by ID
 */
export function useUser(
  id: string,
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User>({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to fetch user permissions
 */
export function useUserPermissions(
  id: string,
  options?: Omit<UseQueryOptions<Permission[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Permission[]>({
    queryKey: userKeys.permissions(id),
    queryFn: () => userService.getUserPermissions(id),
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to fetch user activities
 */
export function useUserActivities(
  id: string,
  page = 1,
  perPage = 20,
  options?: Omit<UseQueryOptions<PaginatedResponse<ActivityLog>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<ActivityLog>>({
    queryKey: userKeys.activities(id, page),
    queryFn: () => userService.getUserActivities(id, page, perPage),
    enabled: !!id,
    ...options,
  })
}

/**
 * Hook to fetch user statistics
 */
export function useUserStats(
  options?: Omit<UseQueryOptions<UserStats>, 'queryKey' | 'queryFn'>
) {
  return useQuery<UserStats>({
    queryKey: userKeys.stats(),
    queryFn: () => userService.getUserStats(),
    staleTime: 60000, // 1 minute
    ...options,
  })
}

/**
 * Hook to create new user
 */
export function useCreateUser(
  options?: UseMutationOptions<User, Error, CreateUserInput>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, CreateUserInput>({
    mutationFn: (data) => userService.createUser(data),
    onSuccess: (data) => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success('User created successfully', {
        description: `${data.name} has been added to the system`,
      })
    },
    onError: (error) => {
      toast.error('Failed to create user', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to update user
 */
export function useUpdateUser(
  options?: UseMutationOptions<User, Error, { id: string; data: UpdateUserInput }>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, { id: string; data: UpdateUserInput }>({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      
      toast.success('User updated successfully', {
        description: `${data.name} has been updated`,
      })
    },
    onError: (error) => {
      toast.error('Failed to update user', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to delete user
 */
export function useDeleteUser(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      queryClient.removeQueries({ queryKey: userKeys.detail(id) })
      
      toast.success('User deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete user', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to bulk delete users
 */
export function useBulkDeleteUsers(
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string[]>({
    mutationFn: (ids) => userService.bulkDeleteUsers(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success(`${ids.length} user(s) deleted successfully`)
    },
    onError: (error) => {
      toast.error('Failed to delete users', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to bulk activate users
 */
export function useBulkActivateUsers(
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string[]>({
    mutationFn: (ids) => userService.bulkActivateUsers(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success(`${ids.length} user(s) activated successfully`)
    },
    onError: (error) => {
      toast.error('Failed to activate users', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to bulk deactivate users
 */
export function useBulkDeactivateUsers(
  options?: UseMutationOptions<void, Error, string[]>
) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string[]>({
    mutationFn: (ids) => userService.bulkDeactivateUsers(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success(`${ids.length} user(s) deactivated successfully`)
    },
    onError: (error) => {
      toast.error('Failed to deactivate users', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to activate user
 */
export function useActivateUser(
  options?: UseMutationOptions<User, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, string>({
    mutationFn: (id) => userService.activateUser(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success('User activated', {
        description: `${data.name} is now active`,
      })
    },
    onError: (error) => {
      toast.error('Failed to activate user', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to deactivate user
 */
export function useDeactivateUser(
  options?: UseMutationOptions<User, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, string>({
    mutationFn: (id) => userService.deactivateUser(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.stats() })
      
      toast.success('User deactivated', {
        description: `${data.name} is now inactive`,
      })
    },
    onError: (error) => {
      toast.error('Failed to deactivate user', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to verify user email
 */
export function useVerifyEmail(
  options?: UseMutationOptions<User, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, string>({
    mutationFn: (id) => userService.verifyEmail(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      
      toast.success('Email verified', {
        description: `${data.email} has been verified`,
      })
    },
    onError: (error) => {
      toast.error('Failed to verify email', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to send password reset
 */
export function useSendPasswordReset(
  options?: UseMutationOptions<void, Error, string>
) {
  return useMutation<void, Error, string>({
    mutationFn: (id) => userService.sendPasswordReset(id),
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error) => {
      toast.error('Failed to send password reset', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar(
  options?: UseMutationOptions<User, Error, { id: string; file: File }>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, { id: string; file: File }>({
    mutationFn: ({ id, file }) => userService.uploadAvatar(id, file),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      toast.success('Avatar uploaded successfully')
    },
    onError: (error) => {
      toast.error('Failed to upload avatar', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar(
  options?: UseMutationOptions<User, Error, string>
) {
  const queryClient = useQueryClient()

  return useMutation<User, Error, string>({
    mutationFn: (id) => userService.deleteAvatar(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      
      toast.success('Avatar deleted successfully')
    },
    onError: (error) => {
      toast.error('Failed to delete avatar', {
        description: error.message || 'Something went wrong',
      })
    },
    ...options,
  })
}

/**
 * Hook to export users
 */
export function useExportUsers() {
  return useMutation<Blob, Error, UserFilters | undefined>({
    mutationFn: (filters) => userService.exportUsers(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Users exported successfully')
    },
    onError: (error) => {
      toast.error('Failed to export users', {
        description: error.message || 'Something went wrong',
      })
    },
  })
}
