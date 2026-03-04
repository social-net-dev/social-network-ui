import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { PostReaction, CommentReaction, ReactRequest, CursorPaginatedResponse, ReactionType } from '../types';

export interface GetPostReactionsParams {
  cursor?: string;
  limit?: number;
  reaction_type?: ReactionType;
}

export const reactionsGetPostReactions = (postId: string, params?: GetPostReactionsParams, signal?: AbortSignal): Promise<CursorPaginatedResponse<PostReaction>> =>
  customInstance({ url: `/posts/${postId}/reactions`, method: 'GET', params, signal });

export const reactionsReactToPost = (postId: string, body: ReactRequest, signal?: AbortSignal): Promise<PostReaction> =>
  customInstance({ url: `/posts/${postId}/reactions`, method: 'POST', data: body, signal });

export const reactionsUnreactPost = (postId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/posts/${postId}/reactions`, method: 'DELETE', signal });

export const reactionsReactToComment = (commentId: string, body: ReactRequest, signal?: AbortSignal): Promise<CommentReaction> =>
  customInstance({ url: `/comments/${commentId}/reactions`, method: 'POST', data: body, signal });

export const reactionsUnreactComment = (commentId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/comments/${commentId}/reactions`, method: 'DELETE', signal });

export const getReactionsGetPostReactionsQueryKey = (postId: string, params?: GetPostReactionsParams) =>
  queryKeys.posts.reactions(postId, params);
