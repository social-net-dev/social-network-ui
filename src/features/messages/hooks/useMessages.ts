import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Hook quản lý tin nhắn
 * Hiện tại dùng mock data, sau này sẽ thay bằng API thật
 */
export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'user-001',
      senderName: 'Nguyễn Văn A',
      senderAvatar: 'https://i.pravatar.cc/150?img=1',
      content: 'Chào bạn, mình có thể hỏi về dự án không?',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
    },
    {
      id: '2',
      senderId: 'user-002',
      senderName: 'Trần Thị B',
      senderAvatar: 'https://i.pravatar.cc/150?img=2',
      content: 'Cảm ơn bạn đã chia sẻ thông tin!',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 phút trước
    },
    {
      id: '3',
      senderId: 'user-003',
      senderName: 'Lê Văn C',
      senderAvatar: 'https://i.pravatar.cc/150?img=3',
      content: 'Bạn có rảnh tối nay không?',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 giờ trước
    },
  ]);

  // Đếm số tin nhắn chưa đọc
  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  // Đánh dấu tin nhắn đã đọc
  const markAsRead = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg))
    );
  }, []);

  // Đánh dấu tất cả tin nhắn đã đọc
  const markAllAsRead = useCallback(() => {
    setMessages((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
  }, []);

  return {
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
