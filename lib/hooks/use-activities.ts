"use client"

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { activityService, ActivityFilters } from '@/lib/api/services/activity.service'
import type { ActivityLog, PaginatedResponse } from '@/types/user'

// Query keys
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (filters?: ActivityFilters) => [...activityKeys.lists(), filters] as const,
  stats: (dateFrom?: string, dateTo?: string) => [...activityKeys.all, 'stats', dateFrom, dateTo] as const,
  filterOptions: () => [...activityKeys.all, 'filterOptions'] as const,
}

/**
 * Hook to fetch paginated activities
 */
export function useActivities(
  filters?: ActivityFilters,
  options?: Omit<UseQueryOptions<PaginatedResponse<ActivityLog>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<ActivityLog>>({
    queryKey: activityKeys.list(filters),
    queryFn: () => activityService.getActivities(filters),
    ...options,
  })
}

/**
 * Hook to fetch activity statistics
 */
export function useActivityStats(
  dateFrom?: string,
  dateTo?: string,
  options?: Omit<UseQueryOptions<{ total: number; by_event: Record<string, number>; by_log_name: Record<string, number> }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: activityKeys.stats(dateFrom, dateTo),
    queryFn: () => activityService.getStats(dateFrom, dateTo),
    ...options,
  })
}

/**
 * Hook to fetch filter options
 */
export function useActivityFilterOptions(
  options?: Omit<UseQueryOptions<{ log_names: string[]; subject_types: string[]; events: string[] }>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: activityKeys.filterOptions(),
    queryFn: () => activityService.getFilterOptions(),
    ...options,
  })
}
