import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/notification";
import api from "@/lib/api";
import { useNotificationSocket } from "./useNotificationSocket";
import { mapBackendNotificationToUi, type BackendNotificationRaw } from "../utils/mapBackendNotification";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

interface NotificationsListResponse {
  notifications: BackendNotificationRaw[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  unread_count: number;
}

async function fetchNotifications(): Promise<NotificationsListResponse> {
  const res = await api.get<NotificationsListResponse>("notifications/", {
    params: { page: 1, page_size: 50 },
  });
  return res.data;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [unreadCountFromWs, setUnreadCountFromWs] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchNotifications,
    staleTime: 60 * 1000,
  });

  const notifications: Notification[] = (data?.notifications ?? []).map(mapBackendNotificationToUi);
  const unreadCount = unreadCountFromWs ?? data?.unread_count ?? notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await api.post(`notifications/${notificationId}/mark-read/`);
        await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      } catch {
        // ignore
      }
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("notifications/mark-all-read/");
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      setUnreadCountFromWs(0);
    } catch {
      // ignore
    }
  }, [queryClient]);

  useNotificationSocket({
    enabled: true,
    onNotification: useCallback(
      (payload: BackendNotificationRaw) => {
        queryClient.setQueryData<NotificationsListResponse>(NOTIFICATIONS_QUERY_KEY, (prev) => {
          if (!prev) return prev;
          const exists = prev.notifications.some((n) => n.id === payload.id);
          if (exists) return prev;
          return {
            ...prev,
            notifications: [payload, ...prev.notifications],
            unread_count: prev.unread_count + 1,
          };
        });
        setUnreadCountFromWs((c) => (c !== null ? c + 1 : null));
      },
      [queryClient]
    ),
    onUnreadCount: useCallback((count: number) => {
      setUnreadCountFromWs(count);
    }, []),
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
  };
}
