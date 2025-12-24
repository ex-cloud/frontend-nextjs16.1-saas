import { useQuery, useMutation, useQueryClient, type UseMutationOptions } from '@tanstack/react-query'
import { roleService } from '@/lib/api/services/role.service'
import { Role, RoleQueryParams, CreateRoleInput, UpdateRoleInput } from '@/types/role'
import { toast } from 'sonner'

/**
 * Hook to fetch all roles
 */
export function useRoles(params?: RoleQueryParams) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => roleService.getRoles(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch single role
 */
export function useRole(id: string) {
  return useQuery({
    queryKey: ['role', id],
    queryFn: () => roleService.getRole(id),
    enabled: !!id,
  })
}

/**
 * Hook to create new role
 */
export function useCreateRole(options?: UseMutationOptions<Role, Error, CreateRoleInput>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleService.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role created successfully')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      toast.error(message);
    },
    ...options,
  })
}

/**
 * Hook to update existing role
 */
export function useUpdateRole(options?: UseMutationOptions<Role, Error, { id: string; data: UpdateRoleInput }>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => roleService.updateRole(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", variables.id] });
      toast.success('Role updated successfully')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      toast.error(message);
    },
    ...options,
  })
}

/**
 * Hook to delete role
 */
export function useDeleteRole(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: roleService.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role deleted successfully')
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      toast.error(message);
    },
    ...options,
  })
}
