/**
 * Friends API Service
 */

import apiClient from '../../api';

import type { Friend, FriendRequest, CreateFriendRequestRequest, FriendshipStatus } from '../types';
import type { PaginationParams } from '../types/common.types';

export const friendsApi = {
  async listFriends(params?: PaginationParams): Promise<{
    friends: Friend[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const res = await apiClient.get('/friends/', { params });
    return res.data;
  },

  async sendRequest(data: CreateFriendRequestRequest): Promise<FriendRequest> {
    const res = await apiClient.post<FriendRequest>('/friends/requests/', data);
    return res.data;
  },

  async acceptRequest(requestId: string): Promise<FriendRequest> {
    const res = await apiClient.post<FriendRequest>(`/friends/requests/${requestId}/accept/`);
    return res.data;
  },

  async rejectRequest(requestId: string): Promise<FriendRequest> {
    const res = await apiClient.post<FriendRequest>(`/friends/requests/${requestId}/reject/`);
    return res.data;
  },

  async cancelRequest(requestId: string): Promise<FriendRequest> {
    const res = await apiClient.post<FriendRequest>(`/friends/requests/${requestId}/cancel/`);
    return res.data;
  },

  async listIncomingRequests(params?: PaginationParams): Promise<FriendRequest[]> {
    const res = await apiClient.get<FriendRequest[]>('/friends/requests/incoming/', { params });
    return res.data;
  },

  async listOutgoingRequests(params?: PaginationParams): Promise<FriendRequest[]> {
    const res = await apiClient.get<FriendRequest[]>('/friends/requests/outgoing/', { params });
    return res.data;
  },

  async checkFriendship(userId: string): Promise<FriendshipStatus> {
    const res = await apiClient.get<FriendshipStatus>(`/friends/check/${userId}/`);
    return res.data;
  },

  async removeFriend(friendId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/friends/${friendId}/`);
    return res.data;
  },
};
