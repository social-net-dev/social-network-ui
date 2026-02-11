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

      console.log('\n🔍 ==================== API LOAD MESSAGES ====================');
      console.log('[useMessageManager] 📊 RAW API RESPONSE:', {
        total_messages: rows.length,
      });

      // Log ALL messages to see which ones have E2EE fields
      rows.forEach((msg, idx) => {
        console.log(`\n[useMessageManager] Message ${idx + 1}/${rows.length}:`, {
          id: msg.id?.substring(0, 8) + '...',
          sender: msg.sender_id?.substring(0, 8) + '...',
          has_encrypted_key: !!msg.encrypted_key,
          has_iv: !!msg.iv,
          encrypted_key_length: msg.encrypted_key?.length || 0,
          iv_length: msg.iv?.length || 0,
          encrypted_key_preview: msg.encrypted_key?.substring(0, 40) + '...',
          iv_preview: msg.iv?.substring(0, 20) + '...',
          ciphertext_preview: msg.ciphertext?.substring(0, 30) + '...',
        });
      });

      console.log('===========================================================\n');

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
        // 🔑 CRITICAL: Map E2EE fields from API response for decryption
        encrypted_key: r.encrypted_key,
        iv: r.iv,
      }));

      console.log('📦 [useMessageManager] MAPPED MESSAGES:', {
        total: mapped.length,
        with_e2ee: mapped.filter(m => m.encrypted_key && m.iv).length,
        without_e2ee: mapped.filter(m => !m.encrypted_key || !m.iv).length,
      });

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
