import { api } from '@/lib/api/client'
import { Permission, PermissionsByModule } from '@/types/permission'

interface ApiResponse<T> {
  data: T
}

const PERMISSIONS_ENDPOINT = '/permissions'

export const permissionService = {
  /**
   * Get all permissions
   */
  getPermissions: async (): Promise<Permission[]> => {
    const response = await api.get<ApiResponse<Permission[]>>(PERMISSIONS_ENDPOINT, {
      params: { per_page: 1000 } // Get all permissions
    })
    return response.data.data || []
  },

  /**
   * Group permissions by module (extracted from permission name)
   * Example: "view_users" -> module: "users"
   */
  getPermissionsGroupedByModule: async (): Promise<PermissionsByModule> => {
    const permissions = await permissionService.getPermissions()
    
    const grouped: PermissionsByModule = {}
    
    permissions.forEach(permission => {
      // Extract module from permission name (format: action_module)
      const parts = permission.name.split('_')
      const moduleName = parts.length > 1 ? parts.slice(1).join('_') : 'other'
      
      if (!grouped[moduleName]) {
        grouped[moduleName] = []
      }
      grouped[moduleName].push(permission)
    })
    
    return grouped
  },
}
