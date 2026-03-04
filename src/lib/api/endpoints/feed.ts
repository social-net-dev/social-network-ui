import { customInstance } from '@/lib/api';
import type { FeedResponse } from '../types';

export interface FeedGetFeedParams {
  cursor?: string;
  limit?: number;
  field_id?: string;
  post_type?: string;
}

export const feedGetFeed = (params?: FeedGetFeedParams, signal?: AbortSignal): Promise<FeedResponse> =>
  customInstance({ url: '/feed', method: 'GET', params, signal });

export const getFeedGetFeedQueryKey = (params?: FeedGetFeedParams) =>
  ['/feed', ...(params ? [params] : [])] as const;
