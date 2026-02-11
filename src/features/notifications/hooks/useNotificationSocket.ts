import { useEffect, useRef, useState, useCallback } from "react";
import { getNotificationWebSocketUrl } from "@/lib/config";

export type NotificationSocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

/** Payload server gửi qua WS (type: "notification") */
export interface NotificationSocketPayload {
  id: string;
  recipient_id: string;
  actor_id: string;
  actor: {
    id: string;
    username: string | null;
    display_name: string;
    avatar_path: string | null;
  } | null;
  notification_type: string;
  post_id: string | null;
  comment_id: string | null;
  message: string | null;
  preview_text: string | null;
  reaction_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UseNotificationSocketOptions {
  /** Gọi khi nhận thông báo mới (realtime) */
  onNotification?: (data: NotificationSocketPayload) => void;
  /** Gọi khi nhận cập nhật unread count */
  onUnreadCount?: (count: number) => void;
  /** Bật kết nối (mặc định true nếu có token + tenant) */
  enabled?: boolean;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 2000; // 2s, 4s, 8s, 16s, 32s

export function useNotificationSocket(options: UseNotificationSocketOptions = {}) {
  const { onNotification, onUnreadCount, enabled = true } = options;
  const [status, setStatus] = useState<NotificationSocketStatus>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const onNotificationRef = useRef(onNotification);
  const onUnreadCountRef = useRef(onUnreadCount);
  onNotificationRef.current = onNotification;
  onUnreadCountRef.current = onUnreadCount;

  const connect = useCallback(() => {
    const token = localStorage.getItem("auth_token")?.replace(/"/g, "").trim();
    const tenant = localStorage.getItem("tenant_slug")?.replace(/"/g, "").trim();
    if (!token || !tenant) {
      setStatus("idle");
      return;
    }

    const url = getNotificationWebSocketUrl();
    const separator = url.includes("?") ? "&" : "?";
    const wsUrl = `${url}${separator}token=${encodeURIComponent(token)}&tenant=${encodeURIComponent(tenant)}`;

    setStatus("connecting");
    setLastError(null);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      setLastError(null);
      reconnectAttemptRef.current = 0; // Reset on successful connection
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        if (data.type === "notification" && data.data) {
          onNotificationRef.current?.(data.data as NotificationSocketPayload);
        } else if (data.type === "unread_count" && typeof data.count === "number") {
          onUnreadCountRef.current?.(data.count);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setStatus("closed");
      if (event.code !== 1000 && event.code !== 1005) {
        setLastError(event.reason || `Connection closed (${event.code})`);
        // Auto-reconnect with exponential backoff
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptRef.current);
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setLastError("WebSocket error");
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    connect();

    // Ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttemptRef.current = 0;
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close(1000);
        }
        wsRef.current = null;
      }
      setStatus("closed");
    };
  }, [enabled, connect]);

  return { status, lastError };
}
