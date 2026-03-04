import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { ApiError } from '../types';
import { followsFollowUser, followsUnfollowUser } from '../endpoints/follows';

export { getFollowsGetFollowersQueryKey, getFollowsGetFollowingQueryKey } from '../endpoints/follows';

export const useFollowsFollowUser = (
  options?: UseMutationOptions<{ message: string }, ApiError, { userId: string }>
) =>
  useMutation({ mutationFn: ({ userId }) => followsFollowUser(userId), mutationKey: ['followsFollowUser'], ...options });

export const useFollowsUnfollowUser = (
  options?: UseMutationOptions<{ message: string }, ApiError, { userId: string }>
) =>
  useMutation({ mutationFn: ({ userId }) => followsUnfollowUser(userId), mutationKey: ['followsUnfollowUser'], ...options });
