/**
 * Comments Smart Hook
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postsApi } from '../services';
import type { CreateCommentRequest, UpdateCommentRequest, ReplyRequest } from '../types';
import type { PaginationParams } from '../types/common.types';

export function useInfiniteComments(postId: string, params?: Omit<PaginationParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['comments', 'infinite', postId, params],
    queryFn: ({ pageParam = 1 }) => 
      postsApi.getPostComments(postId, { ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!postId,
  });
}

export function useComments(postId: string, params?: PaginationParams) {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['comments', postId, params],
    queryFn: () => postsApi.getPostComments(postId, params),
    enabled: !!postId,
  });

  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
  };

  return {
    comments: commentsQuery.data?.comments || [],
    pagination: {
      total: commentsQuery.data?.total || 0,
      total_pages: commentsQuery.data?.total_pages || 1,
      page: commentsQuery.data?.page || 1,
      page_size: commentsQuery.data?.page_size || 10,
    },
    isLoading: commentsQuery.isLoading,
    isError: commentsQuery.isError,
    error: commentsQuery.error,
    refetch: commentsQuery.refetch,
    invalidateComments,
  };
}

export function useCommentActions() {
  const queryClient = useQueryClient();

  const createCommentMutation = useMutation({
    mutationFn: (data: CreateCommentRequest) => postsApi.createComment(data),
    onSuccess: (_, { post_id }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', post_id] });
      queryClient.invalidateQueries({ queryKey: ['posts', post_id] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentRequest }) =>
      postsApi.updateComment(commentId, data),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => postsApi.deleteComment(commentId),
  });

  const replyToCommentMutation = useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: ReplyRequest }) =>
      postsApi.replyToComment(commentId, data),
    onSuccess: (_, { data }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.post_id] });
    },
  });

  return {
    createComment: createCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    replyToComment: replyToCommentMutation.mutateAsync,
    isLoading:
      createCommentMutation.isPending ||
      updateCommentMutation.isPending ||
      deleteCommentMutation.isPending,
  };
}
