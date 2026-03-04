import { customInstance } from '@/lib/api';
import type { Comment, CommentResponse, CreateCommentRequest, UpdateCommentRequest, ReplyRequest, CursorPaginatedResponse } from '../types';

interface CursorParams {
  cursor?: string;
  limit?: number;
}

export const commentsCreateComment = (body: CreateCommentRequest, signal?: AbortSignal): Promise<Comment> =>
  customInstance({ url: '/comments/', method: 'POST', data: body, signal });

export const commentsUpdateComment = (commentId: string, body: UpdateCommentRequest, signal?: AbortSignal): Promise<Comment> =>
  customInstance({ url: `/comments/${commentId}`, method: 'PATCH', data: body, signal });

export const commentsDeleteComment = (commentId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/comments/${commentId}`, method: 'DELETE', signal });

export const commentsReplyToComment = (commentId: string, body: ReplyRequest, signal?: AbortSignal): Promise<Comment> =>
  customInstance({ url: `/comments/${commentId}/replies`, method: 'POST', data: body, signal });

export const commentsGetReplies = (commentId: string, params?: CursorParams, signal?: AbortSignal): Promise<CursorPaginatedResponse<Comment>> =>
  customInstance({ url: `/comments/${commentId}/replies`, method: 'GET', params, signal });

export const getCommentsGetRepliesQueryKey = (commentId: string, params?: CursorParams) =>
  [`/comments/${commentId}/replies`, ...(params ? [params] : [])] as const;

// Re-export CommentResponse type for convenience
export type { CommentResponse };
