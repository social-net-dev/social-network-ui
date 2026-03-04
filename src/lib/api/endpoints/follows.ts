import { customInstance } from '@/lib/api';
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
  [`/users/${userId}/followers`, ...(params ? [params] : [])] as const;

export const getFollowsGetFollowingQueryKey = (userId: string, params?: CursorParams) =>
  [`/users/${userId}/following`, ...(params ? [params] : [])] as const;
