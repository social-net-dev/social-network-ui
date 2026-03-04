import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { UserPublic } from '../types';

export const profilesGetProfile = (username: string, signal?: AbortSignal): Promise<UserPublic> =>
  customInstance({ url: `/profiles/${username}`, method: 'GET', signal });

export const getProfilesGetProfileQueryKey = (username: string) =>
  queryKeys.profiles.detail(username);
