/**
 * Search Smart Hook
 */

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services';
import type { SearchUsersParams } from '../services/search';

export function useSearchUsers(params: SearchUsersParams) {
  return useQuery({
    queryKey: ['search', 'users', params],
    queryFn: () => searchApi.searchUsers(params),
    enabled: !!params.q && params.q.length > 2,
  });
}
