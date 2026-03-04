import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { UserPublic, ApiError } from '../types';
import { profilesGetProfile, getProfilesGetProfileQueryKey } from '../endpoints/profiles';

export { getProfilesGetProfileQueryKey } from '../endpoints/profiles';

export const useProfilesGetProfile = <TData = UserPublic>(
  username: string,
  options?: Omit<UseQueryOptions<UserPublic, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getProfilesGetProfileQueryKey(username), queryFn: ({ signal }) => profilesGetProfile(username, signal), ...options });
