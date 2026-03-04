import { useQuery, useMutation, useInfiniteQuery, queryOptions } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { FeedResponse, Post, CommentResponse, CreatePostRequest, UpdatePostRequest, ApiError } from '../types';
import {
  postsListPosts,
  postsGetPost,
  postsCreatePost,
  postsUpdatePost,
  postsDeletePost,
  postsGetMyPosts,
  postsGetPostsByUser,
  postsGetPostComments,
  getPostsListPostsQueryKey,
  getPostsGetPostQueryKey,
  getPostsGetMyPostsQueryKey,
  getPostsGetPostsByUserQueryKey,
  getPostsGetPostCommentsQueryKey,
} from '../endpoints/posts';
import type { CursorParams } from '../endpoints/posts';

export {
  getPostsListPostsQueryKey,
  getPostsGetPostQueryKey,
  getPostsGetMyPostsQueryKey,
  getPostsGetPostsByUserQueryKey,
  getPostsGetPostCommentsQueryKey,
} from '../endpoints/posts';
export type { CursorParams } from '../endpoints/posts';

// ── queryOptions helpers (v5 best practice) ─────────────────────────────────
// Use these for prefetching, type-safe getQueryData, and sharing config:
//   queryClient.prefetchQuery(postDetailOptions('123'))
//   queryClient.getQueryData(postDetailOptions('123').queryKey) // → Post | undefined

export const postListOptions = (params?: CursorParams) =>
  queryOptions({
    queryKey: getPostsListPostsQueryKey(params),
    queryFn: ({ signal }) => postsListPosts(params, signal),
  });

export const postDetailOptions = (postId: string) =>
  queryOptions({
    queryKey: getPostsGetPostQueryKey(postId),
    queryFn: ({ signal }) => postsGetPost(postId, signal),
  });

export const myPostsOptions = (params?: CursorParams) =>
  queryOptions({
    queryKey: getPostsGetMyPostsQueryKey(params),
    queryFn: ({ signal }) => postsGetMyPosts(params, signal),
  });

export const postsByUserOptions = (userId: string, params?: CursorParams) =>
  queryOptions({
    queryKey: getPostsGetPostsByUserQueryKey(userId, params),
    queryFn: ({ signal }) => postsGetPostsByUser(userId, params, signal),
  });

export const postCommentsOptions = (postId: string, params?: CursorParams) =>
  queryOptions({
    queryKey: getPostsGetPostCommentsQueryKey(postId, params),
    queryFn: ({ signal }) => postsGetPostComments(postId, params, signal),
  });

// ── Hooks ────────────────────────────────────────────────────────────────────

export const usePostsListPosts = <TData = FeedResponse>(
  params?: CursorParams,
  options?: Omit<UseQueryOptions<FeedResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...postListOptions(params), ...options });

export const usePostsGetPost = <TData = Post>(
  postId: string,
  options?: Omit<UseQueryOptions<Post, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...postDetailOptions(postId), ...options });

export const usePostsCreatePost = (
  options?: UseMutationOptions<Post, ApiError, CreatePostRequest>
) =>
  useMutation({ mutationFn: (data) => postsCreatePost(data), mutationKey: ['postsCreatePost'], ...options });

export const usePostsUpdatePost = (
  options?: UseMutationOptions<Post, ApiError, { postId: string; data: UpdatePostRequest }>
) =>
  useMutation({ mutationFn: ({ postId, data }) => postsUpdatePost(postId, data), mutationKey: ['postsUpdatePost'], ...options });

export const usePostsDeletePost = (
  options?: UseMutationOptions<{ message: string }, ApiError, { postId: string }>
) =>
  useMutation({ mutationFn: ({ postId }) => postsDeletePost(postId), mutationKey: ['postsDeletePost'], ...options });

export const usePostsGetMyPosts = <TData = FeedResponse>(
  params?: CursorParams,
  options?: Omit<UseQueryOptions<FeedResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...myPostsOptions(params), ...options });

export const usePostsGetPostsByUser = <TData = FeedResponse>(
  userId: string,
  params?: CursorParams,
  options?: Omit<UseQueryOptions<FeedResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...postsByUserOptions(userId, params), ...options });

export const usePostsGetPostComments = <TData = CommentResponse>(
  postId: string,
  params?: CursorParams,
  options?: Omit<UseQueryOptions<CommentResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...postCommentsOptions(postId, params), ...options });

// Infinite query variants for feed-like pagination
export const usePostsListPostsInfinite = (
  params?: Omit<CursorParams, 'cursor'>,
  options?: Omit<UseInfiniteQueryOptions<FeedResponse, ApiError, FeedResponse, ReturnType<typeof getPostsListPostsQueryKey>, string | undefined>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) =>
  useInfiniteQuery({
    queryKey: getPostsListPostsQueryKey(params),
    queryFn: ({ pageParam, signal }) => postsListPosts({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next_page ? lastPage.pagination.next_cursor ?? undefined : undefined,
    ...options,
  });

export const usePostsGetMyPostsInfinite = (
  params?: Omit<CursorParams, 'cursor'>,
  options?: Omit<UseInfiniteQueryOptions<FeedResponse, ApiError, FeedResponse, ReturnType<typeof getPostsGetMyPostsQueryKey>, string | undefined>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) =>
  useInfiniteQuery({
    queryKey: getPostsGetMyPostsQueryKey(params),
    queryFn: ({ pageParam, signal }) => postsGetMyPosts({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next_page ? lastPage.pagination.next_cursor ?? undefined : undefined,
    ...options,
  });

export const usePostsGetPostsByUserInfinite = (
  userId: string,
  params?: Omit<CursorParams, 'cursor'>,
  options?: Omit<UseInfiniteQueryOptions<FeedResponse, ApiError, FeedResponse, ReturnType<typeof getPostsGetPostsByUserQueryKey>, string | undefined>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) =>
  useInfiniteQuery({
    queryKey: getPostsGetPostsByUserQueryKey(userId, params),
    queryFn: ({ pageParam, signal }) => postsGetPostsByUser(userId, { ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next_page ? lastPage.pagination.next_cursor ?? undefined : undefined,
    ...options,
  });
