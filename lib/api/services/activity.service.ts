import { api } from '../client'
import type { ActivityLog, PaginatedResponse } from '@/types/user'

const AUDIT_ENDPOINT = '/hrm/audit-trail'

export interface ActivityFilters {
  page?: number
  per_page?: number
  log_name?: string
  subject_type?: string
  subject_id?: string
  causer_id?: string
  event?: string
  date_from?: string
  date_to?: string
  search?: string
}

export const activityService = {
  /**
   * Get paginated list of activities with filters
   */
  getActivities: async (filters?: ActivityFilters): Promise<PaginatedResponse<ActivityLog>> => {
    const params = new URLSearchParams()
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const response = await api.get<{ success: boolean; data: ActivityLog[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>(
      `${AUDIT_ENDPOINT}?${params.toString()}`
    )
    
    // Map the API response to PaginatedResponse format
    const apiData = response.data
    return {
      data: apiData.data,
      meta: {
        current_page: apiData.meta.current_page,
        last_page: apiData.meta.last_page,
        per_page: apiData.meta.per_page,
        total: apiData.meta.total,
        from: ((apiData.meta.current_page - 1) * apiData.meta.per_page) + 1,
        to: Math.min(apiData.meta.current_page * apiData.meta.per_page, apiData.meta.total),
      },
      links: {
        first: '',
        last: '',
        prev: null,
        next: null,
      },
      success: apiData.success,
    }
  },

  /**
   * Get activity statistics
   */
  getStats: async (dateFrom?: string, dateTo?: string): Promise<{
    total: number
    by_event: Record<string, number>
    by_log_name: Record<string, number>
  }> => {
    const params = new URLSearchParams()
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)

    const response = await api.get<{ success: boolean; data: { total: number; by_event: Record<string, number>; by_log_name: Record<string, number> } }>(`${AUDIT_ENDPOINT}/stats?${params.toString()}`)
    return response.data.data
  },

  /**
   * Get filter options
   */
  getFilterOptions: async (): Promise<{
    log_names: string[]
    subject_types: string[]
    events: string[]
  }> => {
    const response = await api.get<{ success: boolean; data: { log_names: string[]; subject_types: string[]; events: string[] } }>(`${AUDIT_ENDPOINT}/filter-options`)
    return response.data.data
  },
}

export default activityService
