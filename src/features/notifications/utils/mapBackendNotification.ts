import type { Notification, NotificationType } from "@/types/notification";
import { getApiBaseUrl } from "@/lib/config";
import { appendAuthToken } from "@/lib/api/transforms/common";

/** Backend notification item (API list + WS payload) */
export interface BackendNotificationRaw {
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
  is_read: boolean;
  created_at: string;
}

const NOTIFICATION_TYPE_MAP: Record<string, NotificationType> = {
  POST_REACTION: "like",
  COMMENT_REACTION: "like",
  POST_COMMENT: "comment",
  COMMENT_REPLY: "comment",
  POST_SHARE: "system",
  FRIEND_REQUEST: "follow",
  FRIEND_REQUEST_ACCEPTED: "follow",
};

function backendTypeToUiType(notification_type: string): NotificationType {
  return NOTIFICATION_TYPE_MAP[notification_type] ?? "system";
}

function buildTitle(notification_type: string, actorDisplayName: string): string {
  const name = actorDisplayName || "Ai đó";
  switch (notification_type) {
    case "POST_REACTION":
      return `${name} đã thích bài viết của bạn`;
    case "COMMENT_REACTION":
      return `${name} đã thích bình luận của bạn`;
    case "POST_COMMENT":
      return `${name} đã bình luận về bài viết của bạn`;
    case "COMMENT_REPLY":
      return `${name} đã phản hồi bình luận của bạn`;
    case "POST_SHARE":
      return `${name} đã chia sẻ bài viết của bạn`;
    case "FRIEND_REQUEST":
      return `${name} đã gửi lời mời kết bạn`;
    case "FRIEND_REQUEST_ACCEPTED":
      return `${name} đã chấp nhận lời mời kết bạn`;
    default:
      return `${name} — thông báo mới`;
  }
}

function avatarPathToUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath?.trim()) return undefined;
  if (avatarPath.startsWith("http")) return avatarPath;

  // New backend format: already a media endpoint path (e.g. /media/stream/?path=...)
  if (avatarPath.startsWith("/media/")) {
    const apiBase = getApiBaseUrl().replace(/\/+$/, "");
    return `${apiBase}${appendAuthToken(avatarPath)}`;
  }

  // Legacy: treat as static media path under /media/<path>
  const apiBase = getApiBaseUrl().trim().replace(/\/api\/?$/, "");
  const protocol = typeof window !== "undefined" ? window.location.protocol : "http:";
  const host = apiBase.startsWith("http") ? apiBase : `${protocol}//${typeof window !== "undefined" ? window.location.host : "localhost"}${apiBase || ""}`;
  const mediaBase = host.replace(/\/+$/, "") + "/media/";
  return mediaBase + avatarPath.replace(/^\//, "");
}

export function mapBackendNotificationToUi(raw: BackendNotificationRaw): Notification {
  const actorName = raw.actor?.display_name ?? "";
  return {
    id: raw.id,
    type: backendTypeToUiType(raw.notification_type),
    title: buildTitle(raw.notification_type, actorName),
    message: raw.message ?? "",
    isRead: raw.is_read,
    createdAt: new Date(raw.created_at),
    avatar: avatarPathToUrl(raw.actor?.avatar_path ?? null),
    postId: raw.post_id ?? undefined,
    userId: raw.actor_id ?? raw.actor?.id,
    actionUrl: raw.post_id ? `/post/${raw.post_id}` : undefined,
  };
}
