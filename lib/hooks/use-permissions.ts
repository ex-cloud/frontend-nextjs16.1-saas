import { useQuery } from '@tanstack/react-query'
import { permissionService } from '@/lib/api/services/permission.service'

/**
 * Hook to fetch all permissions
 */
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionService.getPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
  })
}

/**
 * Hook to fetch permissions grouped by module
 */
export function usePermissionsByModule() {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: () => permissionService.getPermissionsGroupedByModule(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
