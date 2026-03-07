import { create } from 'zustand';

interface NotificationState {
  unreadCount: number | null;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: (s.unreadCount ?? 0) + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
}));
