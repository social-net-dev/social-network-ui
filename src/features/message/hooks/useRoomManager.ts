import { useState, useEffect, useCallback } from 'react';
import { fetchRoomsForUser, callCreateRoom } from '../services/messageApi';
import type { IRoomUser } from '../types/message.types';

export interface UseRoomManagerProps {
  userId: string;
}

export const useRoomManager = ({ userId }: UseRoomManagerProps) => {
  const [rooms, setRooms] = useState<IRoomUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setRooms(res.data || []);
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
