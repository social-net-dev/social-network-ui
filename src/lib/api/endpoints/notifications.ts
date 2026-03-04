import { customInstance } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { Notification, UnreadCountResponse, NotificationListResponse } from '../types';

interface CursorParams {
  cursor?: string;
  limit?: number;
}

export const notificationsListNotifications = (params?: CursorParams, signal?: AbortSignal): Promise<NotificationListResponse> =>
  customInstance({ url: '/notifications/', method: 'GET', params, signal });

export const notificationsMarkAsRead = (notificationId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/notifications/${notificationId}/read`, method: 'POST', signal });

export const notificationsMarkAllAsRead = (signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: '/notifications/read-all', method: 'POST', signal });

export const notificationsUnreadCount = (signal?: AbortSignal): Promise<UnreadCountResponse> =>
  customInstance({ url: '/notifications/unread-count', method: 'GET', signal });

export const notificationsDeleteNotification = (notificationId: string, signal?: AbortSignal): Promise<{ message: string }> =>
  customInstance({ url: `/notifications/${notificationId}`, method: 'DELETE', signal });

export const getNotificationsListNotificationsQueryKey = (params?: CursorParams) =>
  queryKeys.notifications.list(params);

export const getNotificationsUnreadCountQueryKey = () =>
  queryKeys.notifications.unreadCount();

// Re-export for convenience
export type { Notification };
