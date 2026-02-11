import { useCallback } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { PostsV2API } from '@/lib/api/generated';
import { transformPost } from '@/lib/api/transforms';
import { queryKeys } from '@/lib/query-keys';
import apiClient from '@/lib/api';

// Response shape from enriched backend feed endpoint
interface FeedPageResponse {
  posts: any[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface UseFeedOptions {
  fieldId?: string;
  postType?: string;
}

export function useFeed(options?: UseFeedOptions) {
  const queryClient = useQueryClient();
  const pageSize = 10;
  const fieldId = options?.fieldId || '';
  const postType = options?.postType || '';

  const query = useInfiniteQuery<FeedPageResponse, Error, InfiniteData<FeedPageResponse>, readonly unknown[], number>({
    queryKey: [...(queryKeys.feed.posts(1) as unknown as readonly unknown[]), fieldId, postType],
    queryFn: async ({ pageParam = 1 }) => {
      const raw: any = await PostsV2API.getFeedV2FeedGet({
        page: pageParam,
        page_size: pageSize,
        ...(fieldId ? { field_id: fieldId } : {}),
        ...(postType ? { post_type: postType } : {}),
      } as any);
      // Handle both wrapped { data: { posts, ... } } and direct { posts, ... } responses
      const data = raw?.data || raw;
      const rawPosts = data?.posts || data?.items || (Array.isArray(data) ? data : []);
      return {
        posts: rawPosts.map(transformPost),
        page: data?.page || pageParam,
        page_size: data?.page_size || pageSize,
        total: data?.total || 0,
        total_pages: data?.total_pages || 1,
      } as FeedPageResponse;
    },
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.page;
      const totalPages = lastPage.total_pages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const posts = query.data?.pages.flatMap(page => page.posts || []) ?? [];

  const createPost = useCallback(
    async (content: string, files: File[], postType?: string, fieldId?: string) => {
      // Build FormData manually because the Orval-generated function
      // does not include post_type / field_id in FormData construction.
      const fd = new FormData();
      fd.append('content_text', content);
      fd.append('visibility', 'PUBLIC');
      fd.append('post_type', postType || 'SOCIAL');
      fd.append('field_id', fieldId || '');
      if (files?.length) {
        files.forEach(f => fd.append('files', f));
      }
      const res = await apiClient.post('/posts/create/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      return res.data;
    },
    [queryClient]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
  }, [queryClient]);

  return {
    posts,
    isLoading: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    createPost,
    refresh,
    isCreating: false,
  };
}
