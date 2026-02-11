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
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  const notifications: Notification[] = (data?.notifications ?? []).map(mapBackendNotificationToUi);
  const unreadCount = unreadCountFromWs ?? data?.unread_count ?? notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await api.post(`notifications/${notificationId}/read/`);
        await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      } catch {
        // ignore
      }
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("notifications/read-all/");
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
        // Optimistically add to cache if data exists
        const updated = queryClient.setQueryData<NotificationsListResponse>(NOTIFICATIONS_QUERY_KEY, (prev) => {
          if (!prev) return prev;
          const exists = prev.notifications.some((n) => n.id === payload.id);
          if (exists) return prev;
          return {
            ...prev,
            notifications: [payload, ...prev.notifications],
            unread_count: prev.unread_count + 1,
          };
        });
        // If cache was empty (query not yet fetched), trigger a refetch
        if (!updated) {
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        }
        setUnreadCountFromWs((c) => (c !== null ? c + 1 : (updated?.unread_count ?? 1)));
      },
      [queryClient]
    ),
    onUnreadCount: useCallback((count: number) => {
      setUnreadCountFromWs(count);
    }, []),
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
