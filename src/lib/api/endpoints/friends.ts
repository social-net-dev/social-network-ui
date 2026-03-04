import { customInstance } from '@/lib/api';
import type { Friend, FriendRequest, FriendshipStatus, CreateFriendRequestRequest, PaginatedResponse } from '../types';

export interface PaginationParams {
  page?: number;
  page_size?: number;
}

export const friendsListFriends = (params?: PaginationParams, signal?: AbortSignal): Promise<PaginatedResponse<Friend>> =>
  customInstance({ url: '/friends/', method: 'GET', params, signal });

export const friendsSendRequest = (body: CreateFriendRequestRequest, signal?: AbortSignal): Promise<FriendRequest> =>
  customInstance({ url: '/friends/requests', method: 'POST', data: body, signal });

export const friendsAcceptRequest = (requestId: string, signal?: AbortSignal): Promise<FriendRequest> =>
  customInstance({ url: `/friends/requests/${requestId}/accept`, method: 'POST', signal });

export const friendsRejectRequest = (requestId: string, signal?: AbortSignal): Promise<FriendRequest> =>
  customInstance({ url: `/friends/requests/${requestId}/reject`, method: 'POST', signal });

export const friendsCancelRequest = (requestId: string, signal?: AbortSignal): Promise<FriendRequest> =>
  customInstance({ url: `/friends/requests/${requestId}/cancel`, method: 'POST', signal });

export const friendsListIncomingRequests = (params?: PaginationParams, signal?: AbortSignal): Promise<FriendRequest[]> =>
  customInstance({ url: '/friends/requests/incoming', method: 'GET', params, signal });

export const friendsListOutgoingRequests = (params?: PaginationParams, signal?: AbortSignal): Promise<FriendRequest[]> =>
  customInstance({ url: '/friends/requests/outgoing', method: 'GET', params, signal });

export const friendsCheckFriendship = (userId: string, signal?: AbortSignal): Promise<FriendshipStatus> =>
  customInstance({ url: `/friends/check/${userId}`, method: 'GET', signal });

export const friendsRemoveFriend = (friendId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/friends/${friendId}`, method: 'DELETE', signal });

export const getFriendsListFriendsQueryKey = (params?: PaginationParams) =>
  ['/friends/', ...(params ? [params] : [])] as const;

export const getFriendsListIncomingRequestsQueryKey = (params?: PaginationParams) =>
  ['/friends/requests/incoming', ...(params ? [params] : [])] as const;

export const getFriendsListOutgoingRequestsQueryKey = (params?: PaginationParams) =>
  ['/friends/requests/outgoing', ...(params ? [params] : [])] as const;

export const getFriendsCheckFriendshipQueryKey = (userId: string) =>
  [`/friends/check/${userId}`] as const;
