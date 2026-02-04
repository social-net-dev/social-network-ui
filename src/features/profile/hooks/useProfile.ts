import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { ProfilesAPI, UsersAPI } from '@/lib/api/generated'
import { transformUserMe, transformAuthor } from '@/lib/api/transforms'
import type {
  EditProfileFormData,
  ProfileVisibilityUpdateRequest
} from '../types/profile.types'
import { queryKeys } from '@/lib/query-keys'
import { useAuthStore } from '@/stores/authStore'

export function useProfile(userIdParam?: string) {
  const params = useParams()
  const { user, isAuthenticated } = useAuthStore()

  let identifier = userIdParam || params.userId

  if (!identifier && isAuthenticated) {
    identifier = 'me'
  }

  if (identifier && user?.username && identifier === user.username) {
    identifier = 'me'
  }

  const queryClient = useQueryClient()

  // Own profile query
  const meQuery = UsersAPI.useGetUsersMeUsersMeGet({
    query: {
      enabled: identifier === 'me',
      select: transformUserMe
    }
  });

  // Public profile query
  const publicQuery = ProfilesAPI.useGetProfileProfilesUserIdOrUsernameGet(identifier || '', {
    query: {
      enabled: !!identifier && identifier !== 'me',
      select: transformAuthor
    }
  });

  const updateProfileMutation = UsersAPI.useUpdateProfileUsersMeProfilePatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
      },
    }
  })

  const updatePrivacyMutation = UsersAPI.useUpdatePrivacyUsersMePrivacyPatch({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
      },
    }
  })

  const uploadAvatarMutation = UsersAPI.useUploadMyAvatarUsersMeAvatarPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
      },
    }
  })

  return {
    profile: identifier === 'me' ? meQuery.data : publicQuery.data,
    isLoading: meQuery.isPending || publicQuery.isPending,
    error: meQuery.error || publicQuery.error,
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
