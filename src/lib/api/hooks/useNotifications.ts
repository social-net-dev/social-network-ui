/**
 * Notifications Smart Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../services';
import type { PaginationParams } from '../types/common.types';

export function useNotifications(params?: PaginationParams) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.listNotifications(params),
    staleTime: 1000 * 30,
  });

  const unreadCountQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    staleTime: 1000 * 30,
  });

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    notifications: notificationsQuery.data?.notifications || [],
    pagination: {
      total: notificationsQuery.data?.total || 0,
      total_pages: notificationsQuery.data?.total_pages || 1,
      page: notificationsQuery.data?.page || 1,
      page_size: notificationsQuery.data?.page_size || 50,
    },
    unreadCount: unreadCountQuery.data?.unread_count || 0,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
    invalidateNotifications,
  };
}

export function useNotificationActions() {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    delete: deleteNotificationMutation.mutateAsync,
    isLoading:
      markAsReadMutation.isPending ||
      markAllAsReadMutation.isPending ||
      deleteNotificationMutation.isPending,
  };
}
