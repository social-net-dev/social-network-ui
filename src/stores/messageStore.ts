import { create } from 'zustand';
import type { IRoomUser } from '@/features/message/types/message.types';

interface MessageStoreState {
  unreadByRoom: Record<string, number>;
  totalUnread: number;
  setRoomsUnread: (rooms: IRoomUser[]) => void;
  incrementUnread: (roomId: string, amount?: number) => void;
  resetUnread: (roomId: string) => void;
}

const computeTotal = (map: Record<string, number>) => Object.values(map).reduce((sum, v) => sum + (v || 0), 0);

export const useMessageStore = create<MessageStoreState>(set => ({
  unreadByRoom: {},
  totalUnread: 0,
  setRoomsUnread: rooms => {
    const next: Record<string, number> = {};
    rooms.forEach(room => {
      next[room.room_id] = Number(room.unread || 0);
    });
    set({ unreadByRoom: next, totalUnread: computeTotal(next) });
  },
  incrementUnread: (roomId, amount = 1) =>
    set(state => {
      const next = { ...state.unreadByRoom };
      next[roomId] = (next[roomId] || 0) + amount;
      return { unreadByRoom: next, totalUnread: computeTotal(next) };
    }),
  resetUnread: roomId =>
    set(state => {
      const next = { ...state.unreadByRoom };
      next[roomId] = 0;
      return { unreadByRoom: next, totalUnread: computeTotal(next) };
    }),
}));
