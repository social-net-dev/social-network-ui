/**
 * Recommendation API Service
 */

import apiClient from '../../api';
import type { RecommendationResponse } from '../types';

export interface SuggestionParams {
  filter: string;
}

export const recommendationApi = {
  async getSuggestions(params: SuggestionParams): Promise<RecommendationResponse> {
    const res = await apiClient.get<RecommendationResponse>('/recommendations/suggestions/', { params });
    return res?.data || res;
  },
};
