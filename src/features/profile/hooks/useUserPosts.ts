import { useInfiniteQuery } from '@tanstack/react-query';
import { postsGetMyPosts, getPostsGetMyPostsQueryKey, postsGetPostsByUser, getPostsGetPostsByUserQueryKey } from '@/lib/api/generated/posts/posts';
import type { PostSummary } from '@/lib/api/generated/model';

/**
 * Hook to fetch a user's posts (paginated, infinite scroll).
 * Uses generated Orval fns: postsGetMyPosts (self) or postsGetPostsByUser (other).
 */
export function useUserPosts(userId?: string) {
  const pageSize = 10;
  const isMe = userId === 'me' || !userId;

  const query = useInfiniteQuery({
    queryKey: isMe
      ? [...getPostsGetMyPostsQueryKey(), 'infinite']
      : [...getPostsGetPostsByUserQueryKey(userId!), 'infinite'],
    queryFn: async ({ pageParam = 1, signal }) => {
      if (isMe) {
        return postsGetMyPosts({ page: pageParam as number, page_size: pageSize }, undefined, signal);
      }
      return postsGetPostsByUser(userId!, { page: pageParam as number, page_size: pageSize }, undefined, signal);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination.page < pagination.total_pages ? pagination.page + 1 : undefined;
    },
    enabled: !!userId || isMe,
    staleTime: 30_000,
  });

  const posts: PostSummary[] = query.data?.pages.flatMap((page) => page.data.items ?? []) ?? [];
  const total = query.data?.pages[0]?.data.pagination?.total ?? 0;

  return {
    posts,
    total,
    isLoading: query.isPending,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    error: query.error,
  };
}
