import { useQuery, queryOptions } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { UserPublic, ApiError } from '../types';
import { profilesGetProfile, getProfilesGetProfileQueryKey } from '../endpoints/profiles';

export { getProfilesGetProfileQueryKey } from '../endpoints/profiles';

export const profileDetailOptions = (username: string) =>
  queryOptions({
    queryKey: getProfilesGetProfileQueryKey(username),
    queryFn: ({ signal }) => profilesGetProfile(username, signal),
  });

export const useProfilesGetProfile = <TData = UserPublic>(
  username: string,
  options?: Omit<UseQueryOptions<UserPublic, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...profileDetailOptions(username), ...options });
