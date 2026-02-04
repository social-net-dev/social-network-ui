import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { ProfilesAPI, UsersAPI } from '@/lib/api/generated'
import { useUser } from '@/lib/api/hooks/useUser'
import type {
  EditProfileFormData,
  ProfileVisibilityUpdateRequest
} from '../types/profile.types'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/authStore'

export function useProfile(userIdParam?: string) {
  const params = useParams()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()

  let identifier = userIdParam || params.userId

  if (!identifier && isAuthenticated) {
    identifier = 'me'
  }

  if (identifier && currentUser?.username && identifier === currentUser.username) {
    identifier = 'me'
  }

  // Use the Smart Hook for fetching profile
  const { user, isLoading, error, isMe } = useUser(identifier as any)

  const updateProfileMutation = UsersAPI.useUpdateMyProfileUsersMeProfilePatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: UsersAPI.getMeAliasUsersMeGetQueryKey() })
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all })
      },
    }
  })

  const updatePrivacyMutation = ProfilesAPI.useUpdateMyPrivacyUsersMePrivacyPatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: UsersAPI.getMeAliasUsersMeGetQueryKey() })
      },
    }
  })

  const uploadAvatarMutation = UsersAPI.useUploadMyAvatarUsersMeAvatarPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: UsersAPI.getMeAliasUsersMeGetQueryKey() })
      },
    }
  })

  return {
    profile: user,
    isLoading,
    error,
    isMe,
    updateProfile: (data: EditProfileFormData) => updateProfileMutation.mutateAsync({
      data: {
        display_name: data.displayName,
        username: data.username || null,
        birth_date: data.birthDate,
        bio: data.bio
      }
    }),
    updatePrivacy: (data: ProfileVisibilityUpdateRequest) => updatePrivacyMutation.mutateAsync({
      data: data as any
    }),
    uploadAvatar: (file: File) => uploadAvatarMutation.mutateAsync({
      data: { file }
    }),
    isUpdating: updateProfileMutation.isPending || updatePrivacyMutation.isPending || uploadAvatarMutation.isPending,
  }
}
