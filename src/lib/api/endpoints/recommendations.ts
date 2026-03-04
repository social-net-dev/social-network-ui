import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { RecommendationResponse } from '../types';

export const recommendationsSuggestions = (filter: string, signal?: AbortSignal): Promise<RecommendationResponse> =>
  customInstance({ url: '/recommendations/suggestions', method: 'GET', params: { filter }, signal });

export const getRecommendationsSuggestionsQueryKey = (filter: string) =>
  queryKeys.recommendations.suggestions(filter);
