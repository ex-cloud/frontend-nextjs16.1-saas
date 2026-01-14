'use server'

/**
 * Dashboard Server Actions
 * 
 * Server-side data fetching for dashboard page
 * Fetches real data from Laravel backend API
 */

import { auth } from '@/auth'
import axios from 'axios'
import type { 
  UserStats,
  ActivityLog,
  PaginatedResponse,
} from '@/types/user'
import type {
  Department,
  Position,
  Team,
} from '@/types/hrm'

/**
 * Dashboard Statistics Interface
 */
export interface DashboardStats {
  userStats: UserStats
  hrmStats: {
    total_departments: number
    active_departments: number
    total_positions: number
    total_teams: number
  }
  recentActivities: ActivityLog[]
  chartData: {
    date: string
    desktop: number
    mobile: number
  }[]
}

export interface HrmDashboardStats {
  users: {
    total: number
    active: number
    inactive: number
    new_last_30_days: number
  }
  departments: {
    total: number
    active: number
  }
  positions: {
    total: number
    active: number
  }
  teams: {
    total: number
    active: number
  }
}

/**
 * Fetch all dashboard data in parallel
 */
export async function getDashboardData(): Promise<DashboardStats> {
  try {
    // Get session for authentication
    const session = await auth()
    
    if (!session?.user?.accessToken) {
      console.error('No access token available')
      return getEmptyDashboardStats()
    }

    const token = session.user.accessToken
    const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`
    
    // Create axios instance with auth token for server-side requests
    const apiServer = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      timeout: 10000,
    })

    // Fetch all data in parallel for better performance
    const [statsRes, hrmRes, auditRes] = await Promise.allSettled([
      apiServer.get<{ data: UserStats }>('/users/stats'),
      apiServer.get<{ data: HrmDashboardStats }>('/hrm/reports/dashboard'),
      apiServer.get<PaginatedResponse<ActivityLog>>('/hrm/audit-trail?per_page=5'),
    ])

    // Extract user stats
    const userStats: UserStats = statsRes.status === 'fulfilled' 
      ? statsRes.value.data.data 
      : getEmptyDashboardStats().userStats

    // Extract HRM stats
    let hrmStats = getEmptyDashboardStats().hrmStats
    if (hrmRes.status === 'fulfilled') {
      const data = hrmRes.value.data.data
      hrmStats = {
        total_departments: data.departments?.total || 0,
        active_departments: data.departments?.active || 0,
        total_positions: data.positions?.total || 0,
        total_teams: data.teams?.total || 0,
      }
    }

    // Recent activities
    const recentActivities: ActivityLog[] = auditRes.status === 'fulfilled'
      ? auditRes.value.data.data
      : []

    // Chart data - use real trends from userStats
    const chartData = userStats.registration_trends || []

    return {
      userStats,
      hrmStats,
      recentActivities,
      chartData,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error
    }
    console.error('Error fetching dashboard data:', error)
    return getEmptyDashboardStats()
  }
}

/**
 * Return empty dashboard stats
 */
function getEmptyDashboardStats(): DashboardStats {
  return {
    userStats: {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      verified_users: 0,
      unverified_users: 0,
      users_by_role: [],
      registration_trends: [],
    },
    hrmStats: {
      total_departments: 0,
      active_departments: 0,
      total_positions: 0,
      total_teams: 0,
    },
    recentActivities: [],
    chartData: [],
  }
}


/**
 * Get user statistics only (for quick refresh)
 */
export async function getUserStats(): Promise<UserStats> {
  try {
    const session = await auth()
    
    if (!session?.user?.accessToken) {
      throw new Error('No access token available')
    }

    const token = session.user.accessToken
    const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`
    
    const response = await axios.get<{ data: UserStats }>(`${baseURL}/users/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    return response.data.data
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      total_users: 0,
      active_users: 0,
      inactive_users: 0,
      verified_users: 0,
      unverified_users: 0,
      users_by_role: [],
      registration_trends: [],
    }
  }
}

/**
 * Get HRM statistics only
 */
export async function getHRMStats() {
  try {
    const session = await auth()
    
    if (!session?.user?.accessToken) {
      throw new Error('No access token available')
    }

    const token = session.user.accessToken
    const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`
    
    const apiServer = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    const [departmentsRes, positionsRes, teamsRes] = await Promise.all([
      apiServer.get<PaginatedResponse<Department>>('/hrm/departments?per_page=1'),
      apiServer.get<PaginatedResponse<Position>>('/hrm/positions?per_page=1'),
      apiServer.get<PaginatedResponse<Team>>('/hrm/teams?per_page=1'),
    ])

    return {
      total_departments: departmentsRes.data.meta?.total || departmentsRes.data.total || 0,
      active_departments: departmentsRes.data.meta?.total || departmentsRes.data.total || 0,
      total_positions: positionsRes.data.meta?.total || positionsRes.data.total || 0,
      total_teams: teamsRes.data.meta?.total || teamsRes.data.total || 0,
    }
  } catch (error) {
    console.error('Error fetching HRM stats:', error)
    return {
      total_departments: 0,
      active_departments: 0,
      total_positions: 0,
      total_teams: 0,
    }
  }
}
