import { useQuery, useMutation } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { Friend, FriendRequest, FriendshipStatus, CreateFriendRequestRequest, PaginatedResponse, ApiError } from '../types';
import {
  friendsListFriends,
  friendsSendRequest,
  friendsAcceptRequest,
  friendsRejectRequest,
  friendsCancelRequest,
  friendsListIncomingRequests,
  friendsListOutgoingRequests,
  friendsCheckFriendship,
  friendsRemoveFriend,
  getFriendsListFriendsQueryKey,
  getFriendsListIncomingRequestsQueryKey,
  getFriendsListOutgoingRequestsQueryKey,
  getFriendsCheckFriendshipQueryKey,
} from '../endpoints/friends';
import type { PaginationParams } from '../endpoints/friends';

export {
  getFriendsListFriendsQueryKey,
  getFriendsListIncomingRequestsQueryKey,
  getFriendsListOutgoingRequestsQueryKey,
  getFriendsCheckFriendshipQueryKey,
} from '../endpoints/friends';

export const useFriendsListFriends = <TData = PaginatedResponse<Friend>>(
  params?: PaginationParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<Friend>, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getFriendsListFriendsQueryKey(params), queryFn: ({ signal }) => friendsListFriends(params, signal), ...options });

export const useFriendsSendRequest = (
  options?: UseMutationOptions<FriendRequest, ApiError, CreateFriendRequestRequest>
) =>
  useMutation({ mutationFn: (data) => friendsSendRequest(data), mutationKey: ['friendsSendRequest'], ...options });

export const useFriendsAcceptRequest = (
  options?: UseMutationOptions<FriendRequest, ApiError, { requestId: string }>
) =>
  useMutation({ mutationFn: ({ requestId }) => friendsAcceptRequest(requestId), mutationKey: ['friendsAcceptRequest'], ...options });

export const useFriendsRejectRequest = (
  options?: UseMutationOptions<FriendRequest, ApiError, { requestId: string }>
) =>
  useMutation({ mutationFn: ({ requestId }) => friendsRejectRequest(requestId), mutationKey: ['friendsRejectRequest'], ...options });

export const useFriendsCancelRequest = (
  options?: UseMutationOptions<FriendRequest, ApiError, { requestId: string }>
) =>
  useMutation({ mutationFn: ({ requestId }) => friendsCancelRequest(requestId), mutationKey: ['friendsCancelRequest'], ...options });

export const useFriendsListIncomingRequests = <TData = FriendRequest[]>(
  params?: PaginationParams,
  options?: Omit<UseQueryOptions<FriendRequest[], ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getFriendsListIncomingRequestsQueryKey(params), queryFn: ({ signal }) => friendsListIncomingRequests(params, signal), ...options });

export const useFriendsListOutgoingRequests = <TData = FriendRequest[]>(
  params?: PaginationParams,
  options?: Omit<UseQueryOptions<FriendRequest[], ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getFriendsListOutgoingRequestsQueryKey(params), queryFn: ({ signal }) => friendsListOutgoingRequests(params, signal), ...options });

export const useFriendsCheckFriendship = <TData = FriendshipStatus>(
  userId: string,
  options?: Omit<UseQueryOptions<FriendshipStatus, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ queryKey: getFriendsCheckFriendshipQueryKey(userId), queryFn: ({ signal }) => friendsCheckFriendship(userId, signal), ...options });

export const useFriendsRemoveFriend = (
  options?: UseMutationOptions<{ message: string }, ApiError, { friendId: string }>
) =>
  useMutation({ mutationFn: ({ friendId }) => friendsRemoveFriend(friendId), mutationKey: ['friendsRemoveFriend'], ...options });
