import { useInfiniteQuery } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import apiClient from '@/lib/api';
import { transformPost } from '@/lib/api/transforms';
import { queryKeys } from '@/lib/query-keys';
import type { FeedPost } from '@/features/home/types/feed.types';

interface UserPostsPage {
  posts: FeedPost[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/**
 * Hook to fetch a user's posts (enriched, paginated).
 * Uses GET /api/posts/user/{userId}/ or /api/posts/me/list/ for self.
 */
export function useUserPosts(userId?: string) {
  const pageSize = 10;
  const isMe = userId === 'me' || !userId;

  const query = useInfiniteQuery<
    UserPostsPage,
    Error,
    InfiniteData<UserPostsPage>,
    readonly unknown[],
    number
  >({
    queryKey: queryKeys.feed.userPosts(userId || 'me') as unknown as readonly unknown[],
    queryFn: async ({ pageParam = 1 }) => {
      const url = isMe
        ? `/posts/me/list/`
        : `/posts/user/${userId}/`;
      const res = await apiClient.get(url, {
        params: { page: pageParam, page_size: pageSize },
      });
      const data = res.data?.data || res.data;
      const rawPosts = data?.posts || data?.items || (Array.isArray(data) ? data : []);
      return {
        posts: rawPosts.map(transformPost),
        page: data?.page || pageParam,
        page_size: data?.page_size || pageSize,
        total: data?.total || 0,
        total_pages: data?.total_pages || 1,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: UserPostsPage) => {
      return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
    },
    enabled: !!userId || isMe,
    staleTime: 30_000,
  });

  const posts = query.data?.pages.flatMap((page: UserPostsPage) => page.posts || []) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

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
