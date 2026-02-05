import { useState, useEffect, useCallback, useMemo } from 'react';
import { callFetchMessagesRoom } from '../services/messageApi';
import type { IMessage, MessageFull, MessageOut } from '../types/message.types';
import { deduplicateMessages } from '../utils/messageDedupe';

export interface UseMessageManagerProps {
  roomId: string;
  wsMessages: MessageOut[];
}

export const useMessageManager = ({ roomId, wsMessages }: UseMessageManagerProps) => {
  const [fetchedMessages, setFetchedMessages] = useState<MessageFull[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch historical messages for the room via REST
  const loadMessages = useCallback(async () => {
    if (!roomId) {
      setFetchedMessages([]);
      return;
    }

    setLoading(true);
    try {
      const res = await callFetchMessagesRoom(roomId);
      const rows: IMessage[] = res.data || [];
      const mapped: MessageFull[] = rows.map(r => ({
        id: r.id,
        room_id: r.room_id,
        sender_id: r.sender_id,
        ciphertext: r.ciphertext,
        created_at: r.created_at,
        _status: 'sent',
        attachments: (r as any).attachments ?? null,
        attachment_url: (r as any).attachment_url ?? null,
        attachment_urls: (r as any).attachment_urls ?? null,
        pinned: r.pinned,
        reactions: r.reactions,
      }));
      setFetchedMessages(mapped);
    } catch (e) {
      console.error('fetch messages failed', e);
      setFetchedMessages([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Auto-load on room change
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Merge fetched + WebSocket messages with deduplication
  const combinedMessages = useMemo(() => {
    return deduplicateMessages(wsMessages, fetchedMessages);
  }, [wsMessages, fetchedMessages]);

  // Pinned messages
  const pinnedMessages = useMemo(() => {
    return combinedMessages.filter(m => (m as any).pinned);
  }, [combinedMessages]);

  // Non-pinned messages
  const regularMessages = useMemo(() => {
    return combinedMessages.filter(m => !(m as any).pinned);
  }, [combinedMessages]);

  return {
    fetchedMessages,
    setFetchedMessages,
    combinedMessages,
    pinnedMessages,
    regularMessages,
    loading,
    loadMessages,
  };
};
