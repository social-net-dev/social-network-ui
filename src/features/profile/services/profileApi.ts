import api from '@/lib/axios'
import type {
  ProfileData,
  EditProfileFormData,
  PublicProfileResponse,
  UserMeResponse,
  UpdateProfileRequest,
  ProfileVisibilityResponse,
  ProfileVisibilityUpdateRequest
} from '../types/profile.types'

const STORAGE_BASE_URL = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:9000/private'

const mapToProfileData = (data: PublicProfileResponse | UserMeResponse, privacyData?: ProfileVisibilityResponse): ProfileData => {
  // Construct avatar URL
  const avatar = data.avatar_path ? `${STORAGE_BASE_URL}/${data.avatar_path}` : undefined

  // Determine if it is a "UserMe" response by checking for specific fields
  const isMe = 'email' in data
  const meData = isMe ? (data as UserMeResponse) : null
  const publicData = !isMe ? (data as PublicProfileResponse) : null

  return {
    id: data.id,
    username: data.username || undefined,
    displayName: data.display_name || '',
    email: meData?.email,
    phone: meData?.phone || undefined,
    role: meData?.role || undefined,
    accountStatus: meData?.account_status || undefined,
    storageQuotaMb: meData?.storage_quota_mb,
    avatar,
    bio: data.bio || undefined,
    birthDate: data.birth_date || undefined,

    // Default stats (will be updated from friends/posts endpoints)
    followers: 0,
    following: 0,
    postsCount: 0,

    createdAt: meData?.created_at || new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    isOwner: meData ? true : (publicData?.is_owner || false),
    isFriend: publicData?.is_friend || false,

    // Privacy settings (only available for own profile)
    privacy: privacyData ? {
      displayNameVisibility: privacyData.display_name_visibility as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
      birthDateVisibility: privacyData.birth_date_visibility as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
      bioVisibility: privacyData.bio_visibility as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
      avatarVisibility: privacyData.avatar_visibility as 'PUBLIC' | 'FRIENDS' | 'PRIVATE',
    } : undefined,
  }
}

export const profileApi = {
  getProfile: async (userIdOrUsername?: string): Promise<ProfileData> => {
    let data: PublicProfileResponse | UserMeResponse
    let privacyData: ProfileVisibilityResponse | undefined

    // If identifier is provided and is NOT 'me', fetch public profile
    if (userIdOrUsername && userIdOrUsername !== 'me') {
      const response = await api.get<PublicProfileResponse>(`/profiles/${userIdOrUsername}`)
      data = response.data
    } else {
      // Fetch own profile
      const response = await api.get<UserMeResponse>('/users/me')
      data = response.data

      // Fetch privacy settings for own profile
      try {
        const privacyResponse = await api.get<ProfileVisibilityResponse>('/users/me/privacy')
        privacyData = privacyResponse.data
      } catch {
        // Privacy might not be set yet, that's ok
      }
    }

    return mapToProfileData(data, privacyData)
  },

  updateProfile: async (data: EditProfileFormData): Promise<ProfileData> => {
    const payload: UpdateProfileRequest = {
      display_name: data.displayName,
      username: data.username || null,
      birth_date: data.birthDate,
      bio: data.bio,
    }

    const response = await api.patch<UserMeResponse>('/users/me/profile', payload)

    return mapToProfileData(response.data)
  },

  updatePrivacy: async (data: ProfileVisibilityUpdateRequest): Promise<ProfileVisibilityResponse> => {
    const response = await api.patch<ProfileVisibilityResponse>('/users/me/privacy', data)
    return response.data
  },

  uploadAvatar: async (file: File): Promise<ProfileData> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<UserMeResponse>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return mapToProfileData(response.data)
  },
}
