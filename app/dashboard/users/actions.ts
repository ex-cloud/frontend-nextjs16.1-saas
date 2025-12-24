'use server'

import { auth } from '@/auth'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    from: number
    last_page: number
    per_page: number
    to: number
    total: number
  }
}

interface Role {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  is_active: boolean
  email_verified_at: string | null
  roles: Role[]
  avatar_url: string | null
  created_at: string
  updated_at: string
}

interface UserStats {
  total: number
  active: number
  inactive: number
  verified: number
  unverified: number
}

interface InitialData {
  roles: Role[]
  userStats: UserStats
}

function getEmptyInitialData(): InitialData {
  return {
    roles: [],
    userStats: {
      total: 0,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0,
    },
  }
}

/**
 * Fetch initial data for Users page on server-side
 * This reduces client bundle size and improves initial page load
 */
export async function getUsersPageData(): Promise<InitialData> {
  try {
    const session = await auth()

    if (!session?.user?.accessToken) {
      console.warn('No access token found in session')
      return getEmptyInitialData()
    }

    // Create axios instance with auth header
    const apiServer = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    })

    // Fetch roles and user stats in parallel
    const results = await Promise.allSettled([
      apiServer.get<PaginatedResponse<Role>>('/roles?per_page=100'),
      apiServer.get<PaginatedResponse<User>>('/users?per_page=1'),
      apiServer.get<PaginatedResponse<User>>('/users?filter[is_active]=1&per_page=1'),
      apiServer.get<PaginatedResponse<User>>('/users?filter[email_verified]=1&per_page=1'),
    ])

    // Extract roles
    const roles = results[0].status === 'fulfilled' 
      ? results[0].value.data.data 
      : []

    // Calculate user stats from meta.total
    const totalUsers = results[1].status === 'fulfilled' 
      ? results[1].value.data.meta.total 
      : 0
    
    const activeUsers = results[2].status === 'fulfilled' 
      ? results[2].value.data.meta.total 
      : 0
    
    const verifiedUsers = results[3].status === 'fulfilled' 
      ? results[3].value.data.meta.total 
      : 0

    const userStats: UserStats = {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
    }

    return {
      roles,
      userStats,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'digest' in error && error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error
    }
    console.error('Error fetching users page data:', error)
    return getEmptyInitialData()
  }
}

/**
 * Fetch only roles (useful for forms)
 */
export async function getRoles(): Promise<Role[]> {
  try {
    const session = await auth()

    if (!session?.user?.accessToken) {
      return []
    }

    const apiServer = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${session.user.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000,
    })

    const response = await apiServer.get<PaginatedResponse<Role>>('/roles?per_page=100')
    return response.data.data
  } catch (error) {
    console.error('Error fetching roles:', error)
    return []
  }
}
