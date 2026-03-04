import type { CursorPaginatedResponse, NotificationType } from './common';
import type { Author } from './user';

// ─── Notification Models ───────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: NotificationType;
  actor: Author;
  target_id?: string;
  target_type?: 'post' | 'comment' | 'friend_request';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface NotificationListResponse extends CursorPaginatedResponse<Notification> {
  unread_count: number;
}
