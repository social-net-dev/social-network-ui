import { customInstance } from '@/lib/api';
import type { RecommendationResponse } from '../types';

export const recommendationsSuggestions = (filter: string, signal?: AbortSignal): Promise<RecommendationResponse> =>
  customInstance({ url: '/recommendations/suggestions', method: 'GET', params: { filter }, signal });

export const getRecommendationsSuggestionsQueryKey = (filter: string) =>
  ['/recommendations/suggestions', { filter }] as const;
