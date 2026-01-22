import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { profileApi } from '../services/profileApi'
import type { ProfileData, EditProfileFormData } from '../types/profile.types'
import { queryKeys } from '@/lib/query-keys'

export function useProfile(userIdParam?: string) {
  const params = useParams()
  const userId = userIdParam || params.userId || '1'

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.profile.detail(userId),
    queryFn: () => profileApi.getProfile(userId),
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditProfileFormData) => profileApi.updateProfile(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId) })
    },
  })

  const updateProfile = (data: Partial<ProfileData>) => {
    return updateMutation.mutateAsync(data as EditProfileFormData)
  }

  return {
    profile: query.data,
    isLoading: query.isPending,
    error: query.error,
    updateProfile,
    isUpdating: updateMutation.isPending,
  }
}
