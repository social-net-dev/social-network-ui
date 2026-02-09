import { useState, useEffect, useCallback } from 'react';
import { fetchRoomsForUser, callCreateRoom } from '../services/messageApi';
import type { IRoomUser } from '../types/message.types';

import { useMessageStore } from '@/stores/messageStore';
import ChatClient from '../lib/chatClient';

export interface UseRoomManagerProps {
  userId: string;
}

export const useRoomManager = ({ userId }: UseRoomManagerProps) => {
  const [rooms, setRooms] = useState<IRoomUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRoomsUnread = useMessageStore(state => state.setRoomsUnread);
  const incrementUnread = useMessageStore(state => state.incrementUnread);

  // Global WS client to listen for messages across rooms (so unread badges update immediately)
  useEffect(() => {
    if (!userId) return;
    const ws = new ChatClient({ wsUrl: import.meta.env.DEV ? 'ws://localhost:8000/ws' : import.meta.env.VITE_WS_URL || '', restBase: import.meta.env.DEV ? 'http://localhost:8000' : import.meta.env.VITE_API_BASE_URL || '', room: '', userId });
    ws.onMessage = (m: any) => {
      try {
        if (m && m.room_id) {
          // Do not increment for own messages (they will be marked read)
          if (m.sender_id !== userId) incrementUnread(m.room_id, 1);
        }
      } catch (e) {}
    };
    ws.onStatus = () => {};
    ws.onError = () => {};
    return () => {
      try {
        ws.close();
      } catch (e) {}
    };
  }, [userId, incrementUnread]);

  // Load rooms for user
  const loadRooms = useCallback(async () => {
    if (!userId) {
      setRooms([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetchRoomsForUser(userId);

      const nextRooms = res.data || [];
      setRooms(nextRooms);
      setRoomsUnread(nextRooms);
    } catch (e) {
      console.error('fetchRoomsForUser failed', e);
      setError(e instanceof Error ? e.message : String(e));
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-load on mount and userId change
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Poll to keep unread counts in sync (in case of messages from other rooms)
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => {
      loadRooms();
    }, 15000);
    return () => clearInterval(timer);
  }, [userId, loadRooms]);

  // Create new room
  const createRoom = useCallback(
    async (name: string, memberIds: string[]) => {
      try {
        const payload = {
          name: name.trim() || null,
          type: memberIds.length > 2 ? 'group' : 'direct',
          member_ids: memberIds,
          creator_id: userId,
        } as any;

        const res = await callCreateRoom(payload);

        // Refresh rooms list
        await loadRooms();

        return res.data?.id;
      } catch (e) {
        console.error('create room failed', e);
        throw e;
      }
    },
    [userId, loadRooms]
  );

  return {
    rooms,
    loading,
    error,
    loadRooms,
    createRoom,
  };
};
