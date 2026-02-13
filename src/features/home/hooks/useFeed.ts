import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useInfiniteFeed, usePostActions } from '@/lib/api/hooks/usePosts';

interface UseFeedOptions {
  fieldId?: string;
  postType?: string;
}

export function useFeed(options?: UseFeedOptions) {
  const queryClient = useQueryClient();
  const fieldId = options?.fieldId || '';
  const postType = options?.postType || '';

  const query = useInfiniteFeed({
    field_id: fieldId,
    post_type: postType,
  });

  const { createPost: createPostMutation, isLoading: isCreating } = usePostActions();

  const posts = query.data?.pages.flatMap(page => page.posts || []) ?? [];

  const createPost = useCallback(
    async (content: string, files: File[], postType?: string, fieldId?: string) => {
      const res = await createPostMutation({
        content_text: content,
        files,
        post_type: (postType as any) || 'SOCIAL',
        field_id: fieldId,
      });
      return res;
    },
    [createPostMutation]
  );

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
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
    isCreating,
  };
}
