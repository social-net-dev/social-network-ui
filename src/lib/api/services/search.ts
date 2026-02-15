/**
 * Search API Service
 */

import apiClient from '../../api';
import { transformUser } from '../transforms';
import type { PaginationParams } from '../types/common.types';

import type { User } from '../types/user.types';

export interface SearchUsersParams extends PaginationParams {
  q: string;
}

export const searchApi = {
  async searchUsers(params: SearchUsersParams): Promise<{ users: User[]; total: number }> {
    const res = await apiClient.get<Record<string, any>>('/search/users/', { 
      params: {
        q: params.q,
        limit: params.pageSize || 20,
        page: params.page
      } 
    });
    const data = res?.data || res;
    const items = (Array.isArray(data) ? data : (data.users || data.items || [])) as Record<string, any>[];

    return {
      users: items.map((u) => ({
        ...transformUser(u),
        friendshipStatus: (u.friendship_status || u.friendshipStatus) as string,
        friendRequestId: (u.friend_request_id || u.friendRequestId) as string | null,
      })),
      total: (data.total || items.length) as number
    };
  },
};
