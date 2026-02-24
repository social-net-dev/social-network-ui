import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { feedGetFeed, getFeedGetFeedQueryKey } from '@/lib/api/generated/feed/feed';
import { usePostsCreatePost } from '@/lib/api/generated/posts/posts';
import type { FeedGetFeedParams, PostSummary, PostType } from '@/lib/api/generated/model';
import { uploadMediaAsset } from '@/features/posts/lib/uploadMediaAsset';

interface UseFeedOptions {
  fieldId?: string;
  postType?: string;
}

export function useFeed(options?: UseFeedOptions) {
  const queryClient = useQueryClient();
  const fieldId = options?.fieldId || '';
  const postType = options?.postType || '';

  const params = useMemo<FeedGetFeedParams>(
    () => ({
      field_id: fieldId || undefined,
      post_type: postType || undefined,
      page: undefined,
      page_size: undefined,
    }),
    [fieldId, postType],
  );

  const queryKey = useMemo(
    () => getFeedGetFeedQueryKey(params) as unknown as readonly unknown[],
    [params],
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1, signal }) =>
      feedGetFeed({
        ...params,
        page: pageParam,
      }, undefined, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      if (pagination.page < pagination.total_pages) return pagination.page + 1;
      return undefined;
    },
  });

  const createPostMutation = usePostsCreatePost();

  const posts: PostSummary[] = query.data?.pages.flatMap((p) => p.data.items) ?? [];

  const createPost = useCallback(
    async (content: string, files: File[], postType?: string, fieldId?: string) => {
      const media_asset_ids = files?.length
        ? await Promise.all(files.map((f) => uploadMediaAsset(f, 'post')))
        : undefined;

      return createPostMutation.mutateAsync({
        data: {
          content_text: content,
          post_type: (postType as PostType) || 'SOCIAL',
          field_id: fieldId || undefined,
          media_asset_ids: media_asset_ids?.length ? media_asset_ids : undefined,
        },
      });
    },
    [createPostMutation]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

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
