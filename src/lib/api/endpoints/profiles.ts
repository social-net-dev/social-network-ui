import { customInstance } from '@/lib/api';
import type { UserPublic } from '../types';

export const profilesGetProfile = (username: string, signal?: AbortSignal): Promise<UserPublic> =>
  customInstance({ url: `/profiles/${username}`, method: 'GET', signal });

export const getProfilesGetProfileQueryKey = (username: string) =>
  [`/profiles/${username}`] as const;
