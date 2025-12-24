/**
 * HRM Module Permissions
 * 
 * This file defines all available permissions for the HRM module.
 * Total: 15 permissions (5 per entity: departments, positions, teams)
 */

export const HRM_PERMISSIONS = {
  // Department Permissions (5)
  DEPARTMENTS_VIEW: 'hrm.departments.view',
  DEPARTMENTS_CREATE: 'hrm.departments.create',
  DEPARTMENTS_UPDATE: 'hrm.departments.update',
  DEPARTMENTS_DELETE: 'hrm.departments.delete',
  DEPARTMENTS_RESTORE: 'hrm.departments.restore',

  // Position Permissions (5)
  POSITIONS_VIEW: 'hrm.positions.view',
  POSITIONS_CREATE: 'hrm.positions.create',
  POSITIONS_UPDATE: 'hrm.positions.update',
  POSITIONS_DELETE: 'hrm.positions.delete',
  POSITIONS_RESTORE: 'hrm.positions.restore',

  // Team Permissions (5)
  TEAMS_VIEW: 'hrm.teams.view',
  TEAMS_CREATE: 'hrm.teams.create',
  TEAMS_UPDATE: 'hrm.teams.update',
  TEAMS_DELETE: 'hrm.teams.delete',
  TEAMS_RESTORE: 'hrm.teams.restore',
} as const

export type HrmPermission = typeof HRM_PERMISSIONS[keyof typeof HRM_PERMISSIONS]

/**
 * Permission Groups for easier management
 */
export const HRM_PERMISSION_GROUPS = {
  DEPARTMENTS: [
    HRM_PERMISSIONS.DEPARTMENTS_VIEW,
    HRM_PERMISSIONS.DEPARTMENTS_CREATE,
    HRM_PERMISSIONS.DEPARTMENTS_UPDATE,
    HRM_PERMISSIONS.DEPARTMENTS_DELETE,
    HRM_PERMISSIONS.DEPARTMENTS_RESTORE,
  ],
  POSITIONS: [
    HRM_PERMISSIONS.POSITIONS_VIEW,
    HRM_PERMISSIONS.POSITIONS_CREATE,
    HRM_PERMISSIONS.POSITIONS_UPDATE,
    HRM_PERMISSIONS.POSITIONS_DELETE,
    HRM_PERMISSIONS.POSITIONS_RESTORE,
  ],
  TEAMS: [
    HRM_PERMISSIONS.TEAMS_VIEW,
    HRM_PERMISSIONS.TEAMS_CREATE,
    HRM_PERMISSIONS.TEAMS_UPDATE,
    HRM_PERMISSIONS.TEAMS_DELETE,
    HRM_PERMISSIONS.TEAMS_RESTORE,
  ],
  ALL: [
    // Departments
    HRM_PERMISSIONS.DEPARTMENTS_VIEW,
    HRM_PERMISSIONS.DEPARTMENTS_CREATE,
    HRM_PERMISSIONS.DEPARTMENTS_UPDATE,
    HRM_PERMISSIONS.DEPARTMENTS_DELETE,
    HRM_PERMISSIONS.DEPARTMENTS_RESTORE,
    // Positions
    HRM_PERMISSIONS.POSITIONS_VIEW,
    HRM_PERMISSIONS.POSITIONS_CREATE,
    HRM_PERMISSIONS.POSITIONS_UPDATE,
    HRM_PERMISSIONS.POSITIONS_DELETE,
    HRM_PERMISSIONS.POSITIONS_RESTORE,
    // Teams
    HRM_PERMISSIONS.TEAMS_VIEW,
    HRM_PERMISSIONS.TEAMS_CREATE,
    HRM_PERMISSIONS.TEAMS_UPDATE,
    HRM_PERMISSIONS.TEAMS_DELETE,
    HRM_PERMISSIONS.TEAMS_RESTORE,
  ],
} as const

/**
 * Human-readable permission labels
 */
export const HRM_PERMISSION_LABELS: Record<HrmPermission, string> = {
  // Departments
  [HRM_PERMISSIONS.DEPARTMENTS_VIEW]: 'View Departments',
  [HRM_PERMISSIONS.DEPARTMENTS_CREATE]: 'Create Department',
  [HRM_PERMISSIONS.DEPARTMENTS_UPDATE]: 'Update Department',
  [HRM_PERMISSIONS.DEPARTMENTS_DELETE]: 'Delete Department',
  [HRM_PERMISSIONS.DEPARTMENTS_RESTORE]: 'Restore Department',
  // Positions
  [HRM_PERMISSIONS.POSITIONS_VIEW]: 'View Positions',
  [HRM_PERMISSIONS.POSITIONS_CREATE]: 'Create Position',
  [HRM_PERMISSIONS.POSITIONS_UPDATE]: 'Update Position',
  [HRM_PERMISSIONS.POSITIONS_DELETE]: 'Delete Position',
  [HRM_PERMISSIONS.POSITIONS_RESTORE]: 'Restore Position',
  // Teams
  [HRM_PERMISSIONS.TEAMS_VIEW]: 'View Teams',
  [HRM_PERMISSIONS.TEAMS_CREATE]: 'Create Team',
  [HRM_PERMISSIONS.TEAMS_UPDATE]: 'Update Team',
  [HRM_PERMISSIONS.TEAMS_DELETE]: 'Delete Team',
  [HRM_PERMISSIONS.TEAMS_RESTORE]: 'Restore Team',
}

/**
 * Check if a permission string is a valid HRM permission
 */
export function isHrmPermission(permission: string): permission is HrmPermission {
  return Object.values(HRM_PERMISSIONS).includes(permission as HrmPermission)
}
