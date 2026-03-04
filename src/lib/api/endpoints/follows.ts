import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { UserPublic, CursorPaginatedResponse } from '../types';

interface CursorParams {
  cursor?: string;
  limit?: number;
}

export const followsFollowUser = (userId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/users/${userId}/follow`, method: 'POST', signal });

export const followsUnfollowUser = (userId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/users/${userId}/follow`, method: 'DELETE', signal });

export const followsGetFollowers = (userId: string, params?: CursorParams, signal?: AbortSignal): Promise<CursorPaginatedResponse<UserPublic>> =>
  customInstance({ url: `/users/${userId}/followers`, method: 'GET', params, signal });

export const followsGetFollowing = (userId: string, params?: CursorParams, signal?: AbortSignal): Promise<CursorPaginatedResponse<UserPublic>> =>
  customInstance({ url: `/users/${userId}/following`, method: 'GET', params, signal });

export const getFollowsGetFollowersQueryKey = (userId: string, params?: CursorParams) =>
  queryKeys.users.followers(userId, params);

export const getFollowsGetFollowingQueryKey = (userId: string, params?: CursorParams) =>
  queryKeys.users.following(userId, params);
