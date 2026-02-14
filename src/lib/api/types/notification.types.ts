/**
 * Notification related types
 */

import type { Author } from './user.types';
import type { NotificationType } from './common.types';

export interface Notification {
  id: string;
  type: NotificationType;
  actor: Author;
  targetId?: string;
  targetType?: 'post' | 'comment' | 'friend_request';
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MarkAsReadRequest {
  notification_id: string;
}
