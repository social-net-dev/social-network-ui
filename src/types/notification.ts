export type NotificationType = "like" | "comment" | "follow" | "mention" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  avatar?: string;
  postId?: string;
  userId?: string;
  actionUrl?: string;
}
