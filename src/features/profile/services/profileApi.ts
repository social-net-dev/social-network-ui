import { mockApi } from '@/lib/mockApi'
import type { ProfileData, EditProfileFormData } from '../types/profile.types'

export const profileApi = {
  getProfile: async (userId: string): Promise<ProfileData> => {
    return await mockApi.profile.getProfile(userId)
  },

  updateProfile: async (userId: string, data: EditProfileFormData): Promise<ProfileData> => {
    return await mockApi.profile.updateProfile(userId, data)
  },
}
