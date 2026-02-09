import { UsersAPI, ProfilesAPI } from '../generated';
import { transformUserMe, transformAuthor } from '../transforms/userTransform';
import { useAuthStore } from '@/stores/authStore';

/**
 * Smart hook to fetch current user or specific user profile
 * Automatically applies transforms and handles caching
 */
export function useUser(usernameOrId?: string | 'me') {
  const { isAuthenticated } = useAuthStore();
  const target = usernameOrId || 'me';
  const isMe = target === 'me';

  // Me Query
  const meQuery = UsersAPI.useMeAliasUsersMeGet({
    query: {
      enabled: isMe && isAuthenticated,
      select: (data: any) => transformUserMe(data.data || data),
      staleTime: 1000 * 60 * 5, // 5 mins
    }
  });

  // Profile Query
  const profileQuery = ProfilesAPI.useGetProfileProfilesUsernameGet(target === 'me' ? '' : target, {
    query: {
      enabled: !isMe && !!target,
      select: (data: any) => transformAuthor(data.data || data),
    }
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
