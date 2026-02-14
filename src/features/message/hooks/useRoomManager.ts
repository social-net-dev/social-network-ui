import { useState, useEffect, useCallback } from 'react';
import { fetchRoomsForUser, callCreateRoom } from '../services/messageApi';
import { UsersAPI, ProfilesAPI } from '@/lib/api/generated';
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
    const ws = new ChatClient({ wsUrl: import.meta.env.DEV ? 'ws://localhost:8001/ws' : import.meta.env.VITE_WS_URL || '', restBase: import.meta.env.DEV ? 'http://localhost:8001' : import.meta.env.VITE_API_URL_MESSAGE || '', room: '', userId });
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
        // Try to build members array with display names.
        const members: Array<{ user_id: string; display_name?: string }> = [];

        // Fetch current user display name
        let myDisplayName: string | undefined;
        try {
          const meResp = await UsersAPI.meMeGet();
          myDisplayName = meResp?.display_name || undefined;
        } catch (e) {
          // ignore - fallback to undefined
        }

        for (const m of memberIds) {
          // If member matches current userId, use myDisplayName
          if (m === userId) {
            members.push({ user_id: m, display_name: myDisplayName });
            continue;
          }

          // Try to fetch profile by username (best-effort)
          try {
            const prof = await ProfilesAPI.getProfileProfilesUsernameGet(m);
            const id = (prof as any)?.id || m;
            const display = (prof as any)?.display_name || (prof as any)?.username || undefined;
            members.push({ user_id: id, display_name: display });
          } catch (e) {
            // Fallback: push id only
            members.push({ user_id: m });
          }
        }

        const payload: any = {
          name: name.trim() || null,
          type: memberIds.length > 2 ? 'group' : 'dm',
          members,
          creator_id: userId,
        };

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
