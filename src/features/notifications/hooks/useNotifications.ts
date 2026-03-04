import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@/types/notification";
import {
  useNotificationsListNotifications,
  useNotificationsMarkAllAsRead,
  useNotificationsMarkAsRead,
  getNotificationsListNotificationsQueryKey,
} from "@/lib/api/hooks/notifications.hooks";
import { useNotificationSocket } from "./useNotificationSocket";
import { mapApiNotificationToUi, type BackendNotificationRaw } from "../utils/mapBackendNotification";

export function useNotifications() {
  const queryClient = useQueryClient();
  const [unreadCountFromWs, setUnreadCountFromWs] = useState<number | null>(null);

  const queryKey = getNotificationsListNotificationsQueryKey({ limit: 50 });

  const { data, isLoading, isError } = useNotificationsListNotifications(
    { limit: 50 },
    {
      staleTime: 10 * 1000,
      refetchOnWindowFocus: true,
    }
  );

  const markAllAsReadMutation = useNotificationsMarkAllAsRead();
  const markAsReadMutation = useNotificationsMarkAsRead();

  const notifications: Notification[] = (data?.items ?? []).map(mapApiNotificationToUi);
  const unreadCount = unreadCountFromWs ?? data?.unread_count ?? notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsReadMutation.mutateAsync({ notificationId });
        queryClient.invalidateQueries({ queryKey });
      } catch {
        // ignore
      }
    },
    [markAsReadMutation, queryClient, queryKey]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey });
      setUnreadCountFromWs(0);
    } catch {
      // ignore
    }
  }, [markAllAsReadMutation, queryClient, queryKey]);

  useNotificationSocket({
    enabled: true,
    onNotification: useCallback(
      (payload: BackendNotificationRaw) => {
        // Optimistically add WS notification to the Orval query cache
        const updated = queryClient.setQueryData<{ items: any[]; pagination: any; unread_count: number }>(
          queryKey,
          (prev) => {
            if (!prev) return prev;
            const exists = prev.items.some((n: any) => n.id === payload.id);
            if (exists) return prev;
            // Convert raw WS payload to contract Notification shape for cache
            const newItem = {
              id: payload.id,
              type: payload.notification_type,
              actor: payload.actor
                ? { id: payload.actor.id, display_name: payload.actor.display_name, username: payload.actor.username ?? "", avatar: payload.actor.avatar_path }
                : { id: payload.actor_id, display_name: "", username: "", avatar: null },
              target_id: payload.post_id ?? payload.comment_id ?? undefined,
              target_type: payload.post_id ? "post" : payload.comment_id ? "comment" : undefined,
              message: payload.message || payload.preview_text || "",
              is_read: false,
              created_at: payload.created_at,
            };
            return {
              ...prev,
              items: [newItem, ...prev.items],
              unread_count: prev.unread_count + 1,
            };
          }
        );
        if (!updated) {
          queryClient.invalidateQueries({ queryKey });
        }
        setUnreadCountFromWs((c) => (c !== null ? c + 1 : 1));
      },
      [queryClient, queryKey]
    ),
    onUnreadCount: useCallback((count: number) => {
      setUnreadCountFromWs(count);
    }, []),
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

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
