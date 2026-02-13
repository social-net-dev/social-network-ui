/**
 * Notifications API Service
 */

import apiClient from '../../api';

import type { Notification, UnreadCountResponse } from '../types';
import type { PaginationParams } from '../types/common.types';

export const notificationsApi = {
  async listNotifications(params?: PaginationParams): Promise<{
    notifications: Notification[];
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    unread_count: number;
  }> {
    const res = await apiClient.get('/notifications/', { params });
    return res.data;
  },

  async markAsRead(notificationId: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/notifications/${notificationId}/read/`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/notifications/read-all/');
    return res.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const res = await apiClient.get<UnreadCountResponse>('/notifications/unread-count/');
    return res.data;
  },

  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/notifications/${notificationId}/`);
    return res.data;
  },
};
