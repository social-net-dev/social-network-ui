import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { profileApi } from '../services/profileApi'
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

  const query = useQuery({
    queryKey: queryKeys.profile.detail(identifier || 'me'),
    queryFn: () => profileApi.getProfile(identifier),
    enabled: !!identifier,
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: EditProfileFormData) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
      if (identifier && identifier !== 'me') {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(identifier) })
      }
    },
  })

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: ProfileVisibilityUpdateRequest) => profileApi.updatePrivacy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
    },
  })

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail('me') })
      if (identifier && identifier !== 'me') {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(identifier) })
      }
    },
  })

  return {
    profile: query.data,
    isLoading: query.isPending,
    error: query.error,
    updateProfile: updateProfileMutation.mutateAsync,
    updatePrivacy: updatePrivacyMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending || updatePrivacyMutation.isPending || uploadAvatarMutation.isPending,
  }
}
