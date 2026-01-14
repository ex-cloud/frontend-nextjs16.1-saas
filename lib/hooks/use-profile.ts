import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService, type ProfileUpdateData, type PasswordChangeData } from '@/lib/api/services/profile.service'
import { toast } from 'sonner'

export const profileKeys = {
  all: ['profile'] as const,
  detail: () => [...profileKeys.all, 'detail'] as const,
  sessions: () => [...profileKeys.all, 'sessions'] as const,
}

/**
 * Hook to get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: profileKeys.detail(),
    queryFn: () => profileService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ProfileUpdateData) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      toast.success('Profile updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })
}

/**
 * Hook to upload avatar
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      toast.success('Avatar uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload avatar')
    },
  })
}

/**
 * Hook to delete avatar
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail() })
      toast.success('Avatar deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete avatar')
    },
  })
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: PasswordChangeData) => profileService.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password')
    },
  })
}

/**
 * Hook to get active sessions
 */
export function useSessions() {
  return useQuery({
    queryKey: profileKeys.sessions(),
    queryFn: () => profileService.getSessions(),
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook to revoke a session
 */
export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => profileService.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.sessions() })
      toast.success('Session revoked successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke session')
    },
  })
}

/**
 * Hook to revoke all other sessions
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => profileService.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.sessions() })
      toast.success('All other sessions revoked')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to revoke sessions')
    },
  })
}
