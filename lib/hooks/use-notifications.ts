import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService, type NotificationFilters } from '@/lib/api/services/notification.service'
import { toast } from 'sonner'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters?: NotificationFilters) => [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

/**
 * Hook to get paginated notifications
 */
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: notificationKeys.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Poll every minute for real-time updates
  })
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
  })
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to mark a notification as unread
 */
export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsUnread(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('All notifications marked as read')
    },
  })
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      toast.success('Notification deleted')
    },
  })
}
