import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useUser, useUserActions } from '@/lib/api/hooks/useUser'
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
  const { updateProfile: manualUpdate, updatePrivacy: manualUpdatePrivacy, uploadAvatar: manualUploadAvatar, uploadBackground: manualUploadBackground, isLoading: isActionLoading } = useUserActions();

  const handleUpdateProfile = async (data: EditProfileFormData) => {
    const res = await manualUpdate({
      display_name: data.displayName,
      username: data.username || undefined,
      birth_date: data.birthDate && data.birthDate.trim() !== "" ? data.birthDate : undefined,
      bio: data.bio
    });
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    return res;
  };

  const handleUpdatePrivacy = async (data: ProfileVisibilityUpdateRequest) => {
    const res = await manualUpdatePrivacy(data as any);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    return res;
  };

  const handleUploadAvatar = async (file: File) => {
    const res = await manualUploadAvatar(file);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    return res;
  };

  const handleUploadBackground = async (file: File) => {
    const res = await manualUploadBackground(file);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    return res;
  }

  return {
    profile: user,
    isLoading,
    error,
    isMe,
    updateProfile: handleUpdateProfile,
    updatePrivacy: handleUpdatePrivacy,
    uploadAvatar: handleUploadAvatar,
    uploadBackground: handleUploadBackground,
    isUpdating: isActionLoading,
  }
}
