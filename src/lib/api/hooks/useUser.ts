/**
 * User Smart Hook
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { usersApi, profilesApi } from '../services';
import { useAuthStore } from '@/stores/authStore';
import type { UpdateProfileRequest } from '../types';

export function useUser(usernameOrId?: string | 'me') {
  const { isAuthenticated } = useAuthStore();
  const target = usernameOrId || 'me';
  const isMe = target === 'me';

  const meQuery = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
    enabled: isMe && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const profileQuery = useQuery({
    queryKey: ['profiles', target],
    queryFn: () => profilesApi.getProfile(target),
    enabled: !isMe && !!target,
  });

  const query = isMe ? meQuery : profileQuery;

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isMe,
  };
}

export function useUserActions() {
  const updateProfileMutation = useMutation({
    mutationFn: (data: UpdateProfileRequest) => usersApi.updateProfile(data),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
  });

  const uploadBackgroundMutation = useMutation({
    mutationFn: (file: File) => usersApi.uploadBackground(file),
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: (data: { visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' }) => usersApi.updatePrivacy(data),
  });

  const deactivateMutation = useMutation({
    mutationFn: (data: { password: string }) => usersApi.deactivate(data),
  });

  const reactivateMutation = useMutation({
    mutationFn: (data: { email: string }) => usersApi.reactivate(data),
  });

  const createReactivationRequestMutation = useMutation({
    mutationFn: (data: { email: string }) => usersApi.createReactivationRequest(data),
  });

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    uploadBackground: uploadBackgroundMutation.mutateAsync,
    updatePrivacy: updatePrivacyMutation.mutateAsync,
    deactivate: deactivateMutation.mutateAsync,
    reactivate: reactivateMutation.mutateAsync,
    createReactivationRequest: createReactivationRequestMutation.mutateAsync,
    isLoading:
      updateProfileMutation.isPending ||
      uploadAvatarMutation.isPending ||
      uploadBackgroundMutation.isPending,
  };
}
