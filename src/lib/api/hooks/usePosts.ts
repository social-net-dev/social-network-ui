/**
 * Posts Smart Hook
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsApi } from '../services';
import type { CreatePostRequest, UpdatePostRequest } from '../types';
import type { PaginationParams } from '../types/common.types';

export function useInfiniteFeed(params?: Omit<PaginationParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['feed', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => 
      postsApi.getFeed({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

export function useFeed(params?: PaginationParams) {
  const queryClient = useQueryClient();

  const feedQuery = useQuery({
    queryKey: ['feed', params],
    queryFn: () => postsApi.getFeed(params),
    staleTime: 1000 * 60 * 2,
  });

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  return {
    posts: feedQuery.data?.posts || [],
    pagination: {
      total: feedQuery.data?.total || 0,
      total_pages: feedQuery.data?.total_pages || 1,
      page: feedQuery.data?.page || 1,
      page_size: feedQuery.data?.page_size || 10,
    },
    isLoading: feedQuery.isLoading,
    isError: feedQuery.isError,
    error: feedQuery.error,
    refetch: feedQuery.refetch,
    invalidateFeed,
  };
}

export function usePosts(params?: PaginationParams) {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsApi.getPosts(params),
  });

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  return {
    posts: postsQuery.data?.posts || [],
    pagination: {
      total: postsQuery.data?.total || 0,
      total_pages: postsQuery.data?.total_pages || 1,
      page: postsQuery.data?.page || 1,
      page_size: postsQuery.data?.page_size || 10,
    },
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
    refetch: postsQuery.refetch,
    invalidatePosts,
  };
}

export function usePost(postId: string) {
  const queryClient = useQueryClient();

  const postQuery = useQuery({
    queryKey: ['posts', postId],
    queryFn: () => postsApi.getPostDetail(postId),
    enabled: !!postId,
  });

  const invalidatePost = () => {
    queryClient.invalidateQueries({ queryKey: ['posts', postId] });
  };

  return {
    post: postQuery.data,
    isLoading: postQuery.isLoading,
    isError: postQuery.isError,
    error: postQuery.error,
    refetch: postQuery.refetch,
    invalidatePost,
  };
}

export function useMyPosts(params?: PaginationParams) {
  const postsQuery = useQuery({
    queryKey: ['posts', 'me', params],
    queryFn: () => postsApi.getMyPosts(params),
  });

  return {
    posts: postsQuery.data?.posts || [],
    pagination: {
      total: postsQuery.data?.total || 0,
      total_pages: postsQuery.data?.total_pages || 1,
    },
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
    refetch: postsQuery.refetch,
  };
}

export function useUserPosts(userId: string, params?: PaginationParams) {
  const postsQuery = useQuery({
    queryKey: ['posts', 'user', userId, params],
    queryFn: () => postsApi.getPostsByUser(userId, params),
    enabled: !!userId,
  });

  return {
    posts: postsQuery.data?.posts || [],
    pagination: {
      total: postsQuery.data?.total || 0,
      total_pages: postsQuery.data?.total_pages || 1,
    },
    isLoading: postsQuery.isLoading,
    isError: postsQuery.isError,
    error: postsQuery.error,
    refetch: postsQuery.refetch,
  };
}

export function usePostActions() {
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: (data: CreatePostRequest) => postsApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostRequest }) =>
      postsApi.updatePost(postId, data),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['posts', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => postsApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  return {
    createPost: createPostMutation.mutateAsync,
    updatePost: updatePostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    isLoading:
      createPostMutation.isPending ||
      updatePostMutation.isPending ||
      deletePostMutation.isPending,
  };
}
