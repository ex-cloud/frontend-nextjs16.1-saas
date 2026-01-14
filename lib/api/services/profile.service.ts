import { api } from '../client'
import type { User } from '@/types/user'

const PROFILE_ENDPOINT = '/profile'

export interface ProfileUpdateData {
  name?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  username?: string
  email?: string
  phone?: string
  bio?: string
  birth_date?: string | null
  time_zone?: string
  language?: string
  skills?: string[]
}

export interface PasswordChangeData {
  current_password: string
  password: string
  password_confirmation: string
}

export interface Session {
  id: number
  name: string
  last_used_at: string | null
  created_at: string
  is_current: boolean
  abilities: string[]
}

export const profileService = {
  /**
   * Get current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<{ success: boolean; data: User }>(PROFILE_ENDPOINT)
    return response.data.data
  },

  /**
   * Update current user profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const response = await api.put<{ success: boolean; data: User }>(PROFILE_ENDPOINT, data)
    return response.data.data
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post<{ success: boolean; data: { avatar_url: string } }>(
      `${PROFILE_ENDPOINT}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return response.data.data
  },

  /**
   * Delete avatar
   */
  deleteAvatar: async (): Promise<void> => {
    await api.delete(`${PROFILE_ENDPOINT}/avatar`)
  },

  /**
   * Change password
   */
  changePassword: async (data: PasswordChangeData): Promise<void> => {
    await api.post(`${PROFILE_ENDPOINT}/password`, data)
  },

  /**
   * Get active sessions
   */
  getSessions: async (): Promise<Session[]> => {
    const response = await api.get<{ success: boolean; data: Session[] }>(`${PROFILE_ENDPOINT}/sessions`)
    return response.data.data
  },

  /**
   * Revoke a specific session
   */
  revokeSession: async (sessionId: number): Promise<void> => {
    await api.delete(`${PROFILE_ENDPOINT}/sessions/${sessionId}`)
  },

  /**
   * Revoke all other sessions
   */
  revokeAllSessions: async (): Promise<void> => {
    await api.delete(`${PROFILE_ENDPOINT}/sessions`)
  },
}

export default profileService
