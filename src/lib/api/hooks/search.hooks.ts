import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import type { SearchUsersResponse, RecommendationResponse, ApiError } from '../types';
import { searchSearchUsers, getSearchSearchUsersQueryKey } from '../endpoints/search';
import { recommendationsSuggestions, getRecommendationsSuggestionsQueryKey } from '../endpoints/recommendations';
import type { SearchUsersParams } from '../endpoints/search';

export { getSearchSearchUsersQueryKey } from '../endpoints/search';
export { getRecommendationsSuggestionsQueryKey } from '../endpoints/recommendations';

export const useSearchSearchUsers = <TData = SearchUsersResponse>(
  params: SearchUsersParams,
  options?: Omit<UseQueryOptions<SearchUsersResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getSearchSearchUsersQueryKey(params), queryFn: ({ signal }) => searchSearchUsers(params, signal), ...options });

export const useRecommendationsSuggestions = <TData = RecommendationResponse>(
  filter: string,
  options?: Omit<UseQueryOptions<RecommendationResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getRecommendationsSuggestionsQueryKey(filter), queryFn: ({ signal }) => recommendationsSuggestions(filter, signal), ...options });
