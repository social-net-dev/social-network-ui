import { useState, useCallback } from "react";
import type { Notification } from "@/types/notification";

// Mock data - sẽ được thay thế bằng API thực sau
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    title: "Nguyễn Văn A đã thích bài viết của bạn",
    message: '"Chuyến đi Đà Lạt cuối tuần này thật tuyệt vời!"',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
    avatar: "https://i.pravatar.cc/150?img=1",
    postId: "post-1",
    userId: "user-1",
  },
  {
    id: "2",
    type: "comment",
    title: "Trần Thị B đã bình luận về bài viết của bạn",
    message: "Chỗ này nhìn đẹp quá! Bạn ở đâu vậy?",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 phút trước
    avatar: "https://i.pravatar.cc/150?img=2",
    postId: "post-1",
    userId: "user-2",
  },
  {
    id: "3",
    type: "follow",
    title: "Lê Văn C đã bắt đầu theo dõi bạn",
    message: "",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 phút trước
    avatar: "https://i.pravatar.cc/150?img=3",
    userId: "user-3",
  },
  {
    id: "4",
    type: "mention",
    title: "Phạm Thị D đã nhắc đến bạn trong một bài viết",
    message: "Hôm nay đi cà phê cùng @you và mấy đứa bạn...",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 giờ trước
    avatar: "https://i.pravatar.cc/150?img=4",
    postId: "post-2",
    userId: "user-4",
  },
  {
    id: "5",
    type: "like",
    title: "Hoàng Văn E và 3 người khác đã thích ảnh của bạn",
    message: "",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 giờ trước
    avatar: "https://i.pravatar.cc/150?img=5",
    postId: "post-3",
    userId: "user-5",
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
