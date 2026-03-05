/**
 * Friends API Service
 */

import socialClient from '../../socialApi';

import type { Friend, FriendRequest, CreateFriendRequestRequest, FriendshipStatus } from '../types';
import type { PaginationParams } from '../types/common.types';

export const friendsApi = {
  async listFriends(params?: PaginationParams & { q?: string }): Promise<{
    friends: Friend[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const res = await socialClient.get('/friends/', { params });
    return res.data;
  },

  async sendRequest(data: CreateFriendRequestRequest): Promise<FriendRequest> {
    const res = await socialClient.post<FriendRequest>('/friends/requests/', data);
    return res.data;
  },

  async acceptRequest(requestId: string): Promise<FriendRequest> {
    const res = await socialClient.post<FriendRequest>(`/friends/requests/${requestId}/accept/`);
    return res.data;
  },

  async rejectRequest(requestId: string): Promise<FriendRequest> {
    const res = await socialClient.post<FriendRequest>(`/friends/requests/${requestId}/reject/`);
    return res.data;
  },

  async cancelRequest(requestId: string): Promise<FriendRequest> {
    const res = await socialClient.post<FriendRequest>(`/friends/requests/${requestId}/cancel/`);
    return res.data;
  },

  async listIncomingRequests(params?: PaginationParams): Promise<FriendRequest[]> {
    const res = await socialClient.get<Record<string, any>>('/friends/requests/incoming/', { params });
    const data = res?.data || res;
    // normalize possible shapes: array or { items: [], data: [] }
    const items = Array.isArray(data) ? data : data.items || data.users || data.data || [];
    return items as FriendRequest[];
  },

  async listOutgoingRequests(params?: PaginationParams): Promise<FriendRequest[]> {
    const res = await socialClient.get<Record<string, any>>('/friends/requests/outgoing/', { params });
    const data = res?.data || res;
    const items = Array.isArray(data) ? data : data.items || data.users || data.data || [];
    return items as FriendRequest[];
  },

  async checkFriendship(userId: string): Promise<FriendshipStatus> {
    const res = await socialClient.get<FriendshipStatus>(`/friends/check/${userId}/`);
    return res.data;
  },

  async removeFriend(friendId: string): Promise<{ message: string }> {
    const res = await socialClient.delete<{ message: string }>(`/friends/${friendId}/`);
    return res.data;
  },
};
