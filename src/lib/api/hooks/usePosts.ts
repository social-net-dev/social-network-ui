import { PostsV2API } from '../generated';
import { transformPost } from '../transforms/postTransform';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Smart hook for Feed and Post operations
 */
export function usePosts(params: { page?: number; pageSize?: number } = {}) {
  const queryClient = useQueryClient();
  const { page = 1, pageSize = 10 } = params;

  const feedQuery = PostsV2API.useGetFeedV2FeedGet({
    page,
    page_size: pageSize,
  }, {
    query: {
      select: (data: any) => {
        const rawPosts = data?.data?.posts || data?.posts || data?.items || [];
        return {
          posts: rawPosts.map(transformPost),
          totalPages: data?.total_pages || data?.data?.total_pages || 1,
          total: data?.total || data?.data?.total || 0,
        };
      },
    }
  });

  const invalidateFeed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: PostsV2API.getGetFeedV2FeedGetQueryKey() });
  }, [queryClient]);

  return {
    posts: feedQuery.data?.posts || [],
    pagination: {
      totalPages: feedQuery.data?.totalPages || 1,
      total: feedQuery.data?.total || 0,
    },
    isLoading: feedQuery.isLoading,
    isError: feedQuery.isError,
    error: feedQuery.error,
    refetch: feedQuery.refetch,
    invalidateFeed,
  };
}
