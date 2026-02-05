import { useCallback } from 'react';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { PostsV2API } from '@/lib/api/generated';
import { transformPost } from '@/lib/api/transforms';
import { queryKeys } from '@/lib/query-keys';

export function useFeed() {
  const queryClient = useQueryClient();
  const pageSize = 10;

  const query = useInfiniteQuery<Awaited<ReturnType<typeof PostsV2API.getFeedV2FeedGet>>, Error, InfiniteData<Awaited<ReturnType<typeof PostsV2API.getFeedV2FeedGet>>>, readonly unknown[], number>({
    queryKey: queryKeys.feed.posts(1) as unknown as readonly unknown[],
    queryFn: ({ pageParam = 1 }) =>
      PostsV2API.getFeedV2FeedGet({
        page: pageParam,
        page_size: pageSize,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.page;
      const totalPages = lastPage.total_pages;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const posts = query.data?.pages.flatMap(page => (page.posts || []).map(transformPost)) ?? [];

  const createMutation = PostsV2API.useCreatePostV2PostsPost({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      },
    },
  });

  const createPost = useCallback(
    (content: string, files: File[]) => {
      return createMutation.mutateAsync({
        data: {
          content_text: content,
          visibility: 'PUBLIC',
          files,
        },
      });
    },
    [createMutation]
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
    isCreating: createMutation.isPending,
  };
}
