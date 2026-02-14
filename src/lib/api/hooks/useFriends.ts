/**
 * Friends Smart Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '../services';
import type { CreateFriendRequestRequest } from '../types';
import type { PaginationParams } from '../types/common.types';

export function useFriends(params?: PaginationParams) {
  const friendsQuery = useQuery({
    queryKey: ['friends', params],
    queryFn: () => friendsApi.listFriends(params),
  });

  const incomingRequestsQuery = useQuery({
    queryKey: ['friends', 'requests', 'incoming', params],
    queryFn: () => friendsApi.listIncomingRequests(params),
  });

  const outgoingRequestsQuery = useQuery({
    queryKey: ['friends', 'requests', 'outgoing', params],
    queryFn: () => friendsApi.listOutgoingRequests(params),
  });

  return {
    friends: friendsQuery.data?.friends || [],
    friendsCount: friendsQuery.data?.total || 0,
    incomingRequests: incomingRequestsQuery.data || [],
    outgoingRequests: outgoingRequestsQuery.data || [],
    isLoading:
      friendsQuery.isLoading ||
      incomingRequestsQuery.isLoading ||
      outgoingRequestsQuery.isLoading,
    isError: friendsQuery.isError,
    refetchFriends: friendsQuery.refetch,
    refetchIncoming: incomingRequestsQuery.refetch,
    refetchOutgoing: outgoingRequestsQuery.refetch,
  };
}

export function useFriendshipStatus(userId: string) {
  const statusQuery = useQuery({
    queryKey: ['friends', 'check', userId],
    queryFn: () => friendsApi.checkFriendship(userId),
    enabled: !!userId,
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
  };
}

export function useFriendActions() {
  const queryClient = useQueryClient();

  const sendRequestMutation = useMutation({
    mutationFn: (data: CreateFriendRequestRequest) => friendsApi.sendRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsApi.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsApi.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendsApi.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends', 'requests'] });
    },
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendId: string) => friendsApi.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  return {
    sendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    rejectRequest: rejectRequestMutation.mutateAsync,
    cancelRequest: cancelRequestMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutateAsync,
    isLoading:
      sendRequestMutation.isPending ||
      acceptRequestMutation.isPending ||
      rejectRequestMutation.isPending ||
      cancelRequestMutation.isPending,
  };
}
