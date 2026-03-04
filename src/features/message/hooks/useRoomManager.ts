import { useState, useEffect, useCallback } from 'react';
import { fetchRoomsForUser, callCreateRoom } from '../services/messageApi';
import { usersGetMe } from '@/lib/api/endpoints/users';
import { profilesGetProfile } from '@/lib/api/endpoints/profiles';
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
      console.log('[useRoomManager] createRoom called', { name, memberIds });
      try {
        const members: Array<{ user_id: string; display_name: string }> = [];

        // Fetch current user info (username + display)
        let myDisplayName: string | undefined;
        let myUsername: string | undefined;
        let meResp: any = undefined;
        try {
          meResp = await usersGetMe();
          console.log('[useRoomManager] usersGetMe returned', meResp);
          myDisplayName = meResp?.display_name || meResp?.username || undefined;
          myUsername = meResp?.username || meResp?.email || undefined;
        } catch (err) {
          console.error('[useRoomManager] usersApi.getMe error', err);
          myDisplayName = undefined;
          myUsername = undefined;
        }

        if (!myDisplayName) {
          const msg = 'Missing display name for current user; cannot create room without display names for all members';
          console.error('[useRoomManager]', msg);
          throw new Error(msg);
        }

        for (const m of memberIds) {
          console.log('[useRoomManager] resolving member', m);
          if (myUsername && m === myUsername) {
            const myId = (meResp as any)?.id || myUsername;
            members.push({ user_id: String(myId), display_name: myDisplayName });
            console.log('[useRoomManager] added current user as member', { user_id: myId, display_name: myDisplayName });
            continue;
          }

          try {
            const profResp = await profilesGetProfile(m);
            console.log('[useRoomManager] profilesGetProfile returned', profResp);
            const prof = profResp;
            const profId = prof?.id || null;
            const display = prof?.display_name || prof?.username || undefined;
            if (!display || !profId) {
              const msg = `Missing profile id or display name for user ${m}; cannot create room without display names for all members`;
              console.error('[useRoomManager]', msg, { prof });
              throw new Error(msg);
            }
            members.push({ user_id: String(profId), display_name: display });
            console.log('[useRoomManager] added member', { user_id: profId, display_name: display });
          } catch (err) {
            console.error('[useRoomManager] profilesApi.getProfile failed for', m, err);
            throw err;
          }
        }

        const payload: any = {
          name: name.trim() || null,
          type: memberIds.length > 2 ? 'group' : 'dm',
          members,
          creator_id: userId,
        };

        console.log('[useRoomManager] about to callCreateRoom with payload:', payload);
        const res = await callCreateRoom(payload);
        console.log('[useRoomManager] callCreateRoom response:', res?.data ?? res);

        // Refresh rooms list
        await loadRooms();

        // Axios response shape: AxiosResponse<IRoom>. Prefer res.data.id; fall back to common alternatives.
        const roomId = res?.data?.id ?? (res?.data as any)?.room_id ?? (res as any)?.id ?? null;
        return roomId;
      } catch (e) {
        console.error('[useRoomManager] create room failed', e);
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
