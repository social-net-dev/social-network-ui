import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { SearchUsersResponse } from '../types';

export interface SearchUsersParams {
  q: string;
  limit?: number;
  page?: number;
}

export const searchSearchUsers = (params: SearchUsersParams, signal?: AbortSignal): Promise<SearchUsersResponse> =>
  customInstance({ url: '/search/users', method: 'GET', params, signal });

export const getSearchSearchUsersQueryKey = (params: SearchUsersParams) =>
  queryKeys.search.users(params);
