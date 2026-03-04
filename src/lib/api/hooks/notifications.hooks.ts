import { useQuery, useMutation, queryOptions } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import type { UnreadCountResponse, NotificationListResponse, ApiError } from '../types';
import {
  notificationsListNotifications,
  notificationsMarkAsRead,
  notificationsMarkAllAsRead,
  notificationsUnreadCount,
  notificationsDeleteNotification,
  getNotificationsListNotificationsQueryKey,
  getNotificationsUnreadCountQueryKey,
} from '../endpoints/notifications';
import type { CursorParams } from '../endpoints/posts';

export { getNotificationsListNotificationsQueryKey, getNotificationsUnreadCountQueryKey } from '../endpoints/notifications';

export const notificationsListOptions = (params?: CursorParams) =>
  queryOptions({
    queryKey: getNotificationsListNotificationsQueryKey(params),
    queryFn: ({ signal }) => notificationsListNotifications(params, signal),
  });

export const notificationsUnreadCountOptions = () =>
  queryOptions({
    queryKey: getNotificationsUnreadCountQueryKey(),
    queryFn: ({ signal }) => notificationsUnreadCount(signal),
  });

export const useNotificationsListNotifications = <TData = NotificationListResponse>(
  params?: CursorParams,
  options?: Omit<UseQueryOptions<NotificationListResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...notificationsListOptions(params), ...options });

export const useNotificationsUnreadCount = <TData = UnreadCountResponse>(
  options?: Omit<UseQueryOptions<UnreadCountResponse, ApiError, TData>, 'queryKey' | 'queryFn'>
) =>
  useQuery({ ...notificationsUnreadCountOptions(), ...options });

export const useNotificationsMarkAsRead = (
  options?: UseMutationOptions<{ message: string }, ApiError, { notificationId: string }>
) =>
  useMutation({ mutationFn: ({ notificationId }) => notificationsMarkAsRead(notificationId), mutationKey: ['notificationsMarkAsRead'], ...options });

export const useNotificationsMarkAllAsRead = (
  options?: UseMutationOptions<{ message: string }, ApiError, void>
) =>
  useMutation({ mutationFn: () => notificationsMarkAllAsRead(), mutationKey: ['notificationsMarkAllAsRead'], ...options });

export const useNotificationsDeleteNotification = (
  options?: UseMutationOptions<{ message: string }, ApiError, { notificationId: string }>
) =>
  useMutation({ mutationFn: ({ notificationId }) => notificationsDeleteNotification(notificationId), mutationKey: ['notificationsDeleteNotification'], ...options });
