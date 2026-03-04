import { useInfiniteQuery } from '@tanstack/react-query';
import type { UseInfiniteQueryOptions } from '@tanstack/react-query';
import type { FeedResponse, ApiError } from '../types';
import { feedGetFeed, getFeedGetFeedQueryKey } from '../endpoints/feed';
import type { FeedGetFeedParams } from '../endpoints/feed';

export { getFeedGetFeedQueryKey } from '../endpoints/feed';
export type { FeedGetFeedParams } from '../endpoints/feed';

export const useFeedGetFeed = (
  params?: FeedGetFeedParams,
  options?: Omit<UseInfiniteQueryOptions<FeedResponse, ApiError, FeedResponse, ReturnType<typeof getFeedGetFeedQueryKey>, string | undefined>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam'>
) =>
  useInfiniteQuery({
    queryKey: getFeedGetFeedQueryKey(params),
    queryFn: ({ pageParam, signal }) => feedGetFeed({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_next_page ? lastPage.pagination.next_cursor ?? undefined : undefined,
    ...options,
  });
