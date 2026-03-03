import type { Notification, NotificationType } from "@/types/notification";
import type { Notification as ApiNotification, NotificationType as ApiNotificationType } from "@/lib/api/generated/model";
import { buildMediaUrl } from "@/lib/utils/api";

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
  preview_text: string | null;
  reaction_type: string | null;
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

const API_TYPE_TO_UI: Record<string, NotificationType> = {
  POST_LIKE: "like",
  POST_COMMENT: "comment",
  COMMENT_REPLY: "comment",
  FRIEND_REQUEST: "follow",
  FRIEND_ACCEPT: "follow",
  MENTION: "mention",
  SYSTEM: "system",
};

function backendTypeToUiType(notification_type: string): NotificationType {
  return NOTIFICATION_TYPE_MAP[notification_type] ?? "system";
}

function buildTitle(notification_type: string, actorDisplayName: string): string {
  const name = actorDisplayName || "Ai đó";
  switch (notification_type) {
    case "POST_REACTION":
    case "POST_LIKE":
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
    case "FRIEND_ACCEPT":
      return `${name} đã chấp nhận lời mời kết bạn`;
    case "MENTION":
      return `${name} đã nhắc đến bạn`;
    default:
      return `${name} — thông báo mới`;
  }
}

function avatarPathToUrl(avatarPath: string | null | undefined): string | undefined {
  if (!avatarPath?.trim()) return undefined;
  return buildMediaUrl(avatarPath) || undefined;
}

export function mapBackendNotificationToUi(raw: BackendNotificationRaw): Notification {
  const actorName = raw.actor?.display_name ?? "";
  const backendMessage = raw.message?.trim();
  const nType = raw.notification_type;

  let actionUrl: string | undefined;
  if (nType === "FRIEND_REQUEST") {
    actionUrl = "/friends/requests";
  } else if (nType === "FRIEND_ACCEPT" || nType === "FRIEND_REQUEST_ACCEPTED") {
    actionUrl = "/friends";
  } else if (raw.post_id) {
    actionUrl = `/post/${raw.post_id}`;
  }

  return {
    id: raw.id,
    type: backendTypeToUiType(raw.notification_type),
    title: buildTitle(raw.notification_type, actorName),
    message: backendMessage || raw.preview_text || "",
    isRead: raw.is_read,
    createdAt: new Date(raw.created_at),
    avatar: avatarPathToUrl(raw.actor?.avatar_path ?? null),
    postId: raw.post_id ?? undefined,
    userId: raw.actor_id ?? raw.actor?.id,
    actionUrl,
  };
}

/** Map Orval-generated Notification (from API contract) to UI Notification */
export function mapApiNotificationToUi(n: ApiNotification): Notification {
  const type = n.type as unknown as ApiNotificationType;
  const isFriendRequest = (type as string) === "FRIEND_REQUEST";
  const isFriendAccept = (type as string) === "FRIEND_ACCEPT";

  let actionUrl: string | undefined;
  if (isFriendRequest) {
    actionUrl = "/friends/requests";
  } else if (isFriendAccept) {
    actionUrl = "/friends";
  } else if (n.target_type === "post" && n.target_id) {
    actionUrl = `/post/${n.target_id}`;
  }

  return {
    id: n.id,
    type: API_TYPE_TO_UI[type] ?? "system",
    title: buildTitle(type as string, n.actor?.display_name ?? ""),
    message: n.message ?? "",
    isRead: n.is_read,
    createdAt: new Date(n.created_at),
    avatar: n.actor?.avatar ?? undefined,
    postId: n.target_type === "post" ? n.target_id : undefined,
    userId: n.actor?.id,
    actionUrl,
  };
}
