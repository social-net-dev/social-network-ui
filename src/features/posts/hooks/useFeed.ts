import { useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { feedGetFeed, getFeedGetFeedQueryKey, usePostsCreatePost } from '@/lib/api/generated';
import type { FeedGetFeedParams } from '@/lib/api/generated';
import type { PostSummary, PostType } from '@/lib/api/types';
import { uploadMediaAsset } from '@/features/posts/lib/uploadMediaAsset';
import { queryKeys } from '@/lib/queryKeys';

interface UseFeedOptions {
  fieldId?: string;
  postType?: string;
}

export function useFeed(options?: UseFeedOptions) {
  const queryClient = useQueryClient();
  const fieldId = options?.fieldId || '';
  const postType = options?.postType || '';

  const params: FeedGetFeedParams = {
    field_id: fieldId || undefined,
    post_type: postType || undefined,
  };

  // Stable key from factory – no useMemo needed, queryKeys functions are pure
  const queryKey = getFeedGetFeedQueryKey(params);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam, signal }) =>
      feedGetFeed({
        ...params,
        cursor: pageParam as string | undefined,
      }, undefined, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.has_next_page ? pagination.next_cursor : undefined;
    },
  });

  const createPostMutation = usePostsCreatePost();

  const posts: PostSummary[] = query.data?.pages.flatMap((p) => p.items) ?? [];

  const createPost = useCallback(
    async (content: string, files: File[], postType?: string, fieldId?: string) => {
      const media_asset_ids = files?.length
        ? await Promise.all(files.map((f) => uploadMediaAsset(f, 'post')))
        : undefined;

      const newPost = await createPostMutation.mutateAsync({
        data: {
          content_text: content,
          post_type: (postType as PostType) || 'SOCIAL',
          field_id: fieldId || undefined,
          media_asset_ids: media_asset_ids?.length ? media_asset_ids : undefined,
        },
      });

      // Prepend the new post to the first page of the infinite query cache
      // so the feed updates immediately without requiring a full refetch.
      queryClient.setQueryData<InfiniteData<{ items: PostSummary[]; pagination: unknown }>>(
        queryKey as readonly unknown[],
        (old) => {
          if (!old?.pages?.length) return old;
          const firstPage = old.pages[0];
          return {
            ...old,
            pages: [
              { ...firstPage, items: [newPost as unknown as PostSummary, ...(firstPage.items ?? [])] },
              ...old.pages.slice(1),
            ],
          };
        },
      );

      return newPost;
    },
    [createPostMutation, queryClient, queryKey]
  );

  const refresh = useCallback(() => {
    // Invalidate all feed queries using the domain key
    queryClient.invalidateQueries({ queryKey: queryKeys.feed.all() });
  }, [queryClient]);

  return {
    posts,
    queryKey,
    isLoading: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
    createPost,
    refresh,
    isCreating: createPostMutation.isPending,
  };
}
