import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { FeedResponse, Post, CommentResponse, CreatePostRequest, UpdatePostRequest } from '../types';

export interface CursorParams {
  cursor?: string;
  limit?: number;
}

export const postsListPosts = (params?: CursorParams, signal?: AbortSignal): Promise<FeedResponse> =>
  customInstance({ url: '/posts/', method: 'GET', params, signal });

export const postsGetPost = (postId: string, signal?: AbortSignal): Promise<Post> =>
  customInstance({ url: `/posts/${postId}`, method: 'GET', signal });

export const postsCreatePost = (body: CreatePostRequest, signal?: AbortSignal): Promise<Post> =>
  customInstance({ url: '/posts/', method: 'POST', data: body, signal });

export const postsUpdatePost = (postId: string, body: UpdatePostRequest, signal?: AbortSignal): Promise<Post> =>
  customInstance({ url: `/posts/${postId}`, method: 'PATCH', data: body, signal });

export const postsDeletePost = (postId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/posts/${postId}`, method: 'DELETE', signal });

export const postsGetMyPosts = (params?: CursorParams, signal?: AbortSignal): Promise<FeedResponse> =>
  customInstance({ url: '/posts/me', method: 'GET', params, signal });

export const postsGetPostsByUser = (userId: string, params?: CursorParams, signal?: AbortSignal): Promise<FeedResponse> =>
  customInstance({ url: `/posts/users/${userId}`, method: 'GET', params, signal });

export const postsGetPostComments = (postId: string, params?: CursorParams, signal?: AbortSignal): Promise<CommentResponse> =>
  customInstance({ url: `/posts/${postId}/comments`, method: 'GET', params, signal });

export const getPostsListPostsQueryKey = (params?: CursorParams) =>
  queryKeys.posts.list(params);

export const getPostsGetPostQueryKey = (postId: string) =>
  queryKeys.posts.detail(postId);

export const getPostsGetMyPostsQueryKey = (params?: CursorParams) =>
  queryKeys.posts.me(params);

export const getPostsGetPostsByUserQueryKey = (userId: string, params?: CursorParams) =>
  queryKeys.posts.byUser(userId, params);

export const getPostsGetPostCommentsQueryKey = (postId: string, params?: CursorParams) =>
  queryKeys.posts.comments(postId, params);
