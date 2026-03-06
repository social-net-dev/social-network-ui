import { useInfiniteQuery } from '@tanstack/react-query';
import { postsGetMyPosts, getPostsGetMyPostsQueryKey, postsGetPostsByUser, getPostsGetPostsByUserQueryKey } from '@/lib/api/generated';
import type { PostSummary } from '@/lib/api/types';

/**
 * Hook to fetch a user's posts (paginated, infinite scroll).
 * Uses generated Orval fns: postsGetMyPosts (self) or postsGetPostsByUser (other).
 */
export function useUserPosts(userId?: string) {
  const isMe = userId === 'me' || !userId;

  const query = useInfiniteQuery({
    queryKey: isMe
      ? [...getPostsGetMyPostsQueryKey(), 'infinite']
      : [...getPostsGetPostsByUserQueryKey(userId!), 'infinite'],
    queryFn: async ({ pageParam, signal }) => {
      const cursor = pageParam as string | undefined;
      if (isMe) {
        return postsGetMyPosts({ cursor }, undefined, signal);
      }
      return postsGetPostsByUser(userId!, { cursor }, undefined, signal);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.has_next_page ? pagination.next_cursor : undefined;
    },
    enabled: !!userId || isMe,
    staleTime: 30_000,
  });

  const posts: PostSummary[] = query.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  return {
    posts,
    isLoading: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}
