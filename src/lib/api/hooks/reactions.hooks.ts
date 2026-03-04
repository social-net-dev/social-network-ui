import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { PostReaction, CommentReaction, ReactRequest, CursorPaginatedResponse, ApiError } from '../types';
import {
  reactionsGetPostReactions,
  reactionsReactToPost,
  reactionsUnreactPost,
  reactionsReactToComment,
  reactionsUnreactComment,
  getReactionsGetPostReactionsQueryKey,
} from '../endpoints/reactions';
import type { GetPostReactionsParams } from '../endpoints/reactions';

export { getReactionsGetPostReactionsQueryKey } from '../endpoints/reactions';

export const useReactionsGetPostReactions = <TData = CursorPaginatedResponse<PostReaction>>(
  postId: string,
  params?: GetPostReactionsParams,
  options?: UseQueryOptions<CursorPaginatedResponse<PostReaction>, ApiError, TData>
) =>
  useQuery({
    queryKey: getReactionsGetPostReactionsQueryKey(postId, params),
    queryFn: ({ signal }) => reactionsGetPostReactions(postId, params, signal),
    ...options,
  });

export const useReactionsReactToPost = (
  options?: UseMutationOptions<PostReaction, ApiError, { postId: string; data: ReactRequest }>
) =>
  useMutation({ mutationFn: ({ postId, data }) => reactionsReactToPost(postId, data), mutationKey: ['reactionsReactToPost'], ...options });

export const useReactionsUnreactPost = (
  options?: UseMutationOptions<{ message: string }, ApiError, { postId: string }>
) =>
  useMutation({ mutationFn: ({ postId }) => reactionsUnreactPost(postId), mutationKey: ['reactionsUnreactPost'], ...options });

export const useReactionsReactToComment = (
  options?: UseMutationOptions<CommentReaction, ApiError, { commentId: string; data: ReactRequest }>
) =>
  useMutation({ mutationFn: ({ commentId, data }) => reactionsReactToComment(commentId, data), mutationKey: ['reactionsReactToComment'], ...options });

export const useReactionsUnreactComment = (
  options?: UseMutationOptions<{ message: string }, ApiError, { commentId: string }>
) =>
  useMutation({ mutationFn: ({ commentId }) => reactionsUnreactComment(commentId), mutationKey: ['reactionsUnreactComment'], ...options });
