import { useMutation } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import type { ShareResponse, SharePostRequest, ApiError } from '../types';
import { sharesSharePost, sharesUnsharePost } from '../endpoints/shares';

export const useSharesSharePost = (
  options?: UseMutationOptions<ShareResponse, ApiError, { postId: string; data?: SharePostRequest }>
) =>
  useMutation({ mutationFn: ({ postId, data }) => sharesSharePost(postId, data), mutationKey: ['sharesSharePost'], ...options });

export const useSharesUnsharePost = (
  options?: UseMutationOptions<{ message: string }, ApiError, { postId: string }>
) =>
  useMutation({ mutationFn: ({ postId }) => sharesUnsharePost(postId), mutationKey: ['sharesUnsharePost'], ...options });
