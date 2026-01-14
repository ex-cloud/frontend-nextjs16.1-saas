import { api } from '../client'
import type { PaginatedResponse } from '@/types/user'

const NOTIFICATIONS_ENDPOINT = '/notifications'

export interface Notification {
  id: string
  type: string
  data: {
    title: string
    message: string
    action_url?: string
    icon?: string
    [key: string]: unknown
  }
  read_at: string | null
  created_at: string
}

export interface NotificationFilters {
  page?: number
  per_page?: number
  filter?: 'all' | 'unread' | 'read'
}

export const notificationService = {
  /**
   * Get paginated list of notifications
   */
  getNotifications: async (
    filters?: NotificationFilters
  ): Promise<PaginatedResponse<Notification>> => {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value))
        }
      })
    }

    const response = await api.get<{
      success: boolean
      data: Notification[]
      meta: {
        current_page: number
        last_page: number
        per_page: number
        total: number
      }
    }>(`${NOTIFICATIONS_ENDPOINT}?${params.toString()}`)

    return {
      data: response.data.data,
      meta: {
        ...response.data.meta,
        from: (response.data.meta.current_page - 1) * response.data.meta.per_page + 1,
        to: Math.min(
          response.data.meta.current_page * response.data.meta.per_page,
          response.data.meta.total
        ),
      },
      links: { first: '', last: '', prev: null, next: null },
      success: true,
    }
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<{ success: boolean; data: { count: number } }>(
      `${NOTIFICATIONS_ENDPOINT}/unread-count`
    )
    return response.data.data.count
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    await api.post(`${NOTIFICATIONS_ENDPOINT}/${id}/read`)
  },

  /**
   * Mark a notification as unread
   */
  markAsUnread: async (id: string): Promise<void> => {
    await api.post(`${NOTIFICATIONS_ENDPOINT}/${id}/unread`)
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<void> => {
    await api.post(`${NOTIFICATIONS_ENDPOINT}/read-all`)
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`${NOTIFICATIONS_ENDPOINT}/${id}`)
  },
}

export default notificationService
