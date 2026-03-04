import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { Comment, CommentResponse, CreateCommentRequest, UpdateCommentRequest, ReplyRequest, CursorPaginatedResponse, ApiError } from '../types';
import {
  commentsCreateComment,
  commentsUpdateComment,
  commentsDeleteComment,
  commentsReplyToComment,
  commentsGetReplies,
  getCommentsGetRepliesQueryKey,
} from '../endpoints/comments';
import type { CursorParams } from '../endpoints/posts';

export { getCommentsGetRepliesQueryKey } from '../endpoints/comments';

export const useCommentsCreateComment = (
  options?: UseMutationOptions<Comment, ApiError, CreateCommentRequest>
) =>
  useMutation({ mutationFn: (data) => commentsCreateComment(data), mutationKey: ['commentsCreateComment'], ...options });

export const useCommentsUpdateComment = (
  options?: UseMutationOptions<Comment, ApiError, { commentId: string; data: UpdateCommentRequest }>
) =>
  useMutation({ mutationFn: ({ commentId, data }) => commentsUpdateComment(commentId, data), mutationKey: ['commentsUpdateComment'], ...options });

export const useCommentsDeleteComment = (
  options?: UseMutationOptions<{ message: string }, ApiError, { commentId: string }>
) =>
  useMutation({ mutationFn: ({ commentId }) => commentsDeleteComment(commentId), mutationKey: ['commentsDeleteComment'], ...options });

export const useCommentsReplyToComment = (
  options?: UseMutationOptions<Comment, ApiError, { commentId: string; data: ReplyRequest }>
) =>
  useMutation({ mutationFn: ({ commentId, data }) => commentsReplyToComment(commentId, data), mutationKey: ['commentsReplyToComment'], ...options });

export const useCommentsGetReplies = <TData = CursorPaginatedResponse<Comment>>(
  commentId: string,
  params?: CursorParams,
  options?: Omit<UseQueryOptions<CursorPaginatedResponse<Comment>, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({
    queryKey: getCommentsGetRepliesQueryKey(commentId, params),
    queryFn: ({ signal }) => commentsGetReplies(commentId, params, signal),
    ...options,
  });

export type { CommentResponse };
