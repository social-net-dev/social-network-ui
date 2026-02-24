import { useState, useEffect, useCallback, useMemo } from 'react';
import { callFetchMessagesRoom } from '../services/messageApi';
import { getMessageApiUrl, getApiBaseUrl } from '@/lib/config';
import { appendAuthToken } from '@/lib/utils/api';
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
          has_encrypted_key_recipient: !!(msg as any).encrypted_key_recipient,
          has_encrypted_key_sender: !!(msg as any).encrypted_key_sender,
          has_iv: !!msg.iv,
          encrypted_key_length: msg.encrypted_key?.length || 0,
          encrypted_key_recipient_length: (msg as any).encrypted_key_recipient?.length || 0,
          encrypted_key_sender_length: (msg as any).encrypted_key_sender?.length || 0,
          iv_length: msg.iv?.length || 0,
        });

        // Log FULL encrypted keys to verify data integrity
        if (msg.encrypted_key) {
          console.log(`   encrypted_key FULL: ${msg.encrypted_key}`);
        }
        if ((msg as any).encrypted_key_recipient) {
          console.log(`   encrypted_key_recipient FULL: ${(msg as any).encrypted_key_recipient}`);
        }
        if ((msg as any).encrypted_key_sender) {
          console.log(`   encrypted_key_sender FULL: ${(msg as any).encrypted_key_sender}`);
        }
      });

      console.log('===========================================================\n');

      const resolveAttachmentUrl = (url: string | null | undefined): string | null => {
        if (!url) return null;

        try {
          const apiBase = new URL(getApiBaseUrl());
          const msgBase = new URL(getMessageApiUrl());

          // Absolute URL
          if (url.startsWith('http')) {
            try {
              const u = new URL(url);
              // If it's pointing to the main API host but files are served by message service, swap origin
              if (u.origin === apiBase.origin && (u.pathname.startsWith('/files') || u.pathname.startsWith('/media') || u.pathname.startsWith('/api/media') || u.pathname.startsWith('/media/stream'))) {
                const swapped = url.replace(apiBase.origin, msgBase.origin);
                // If message service origin, append auth token if available
                try {
                  const swappedUrl = new URL(swapped);
                  if (swappedUrl.origin === msgBase.origin) {
                    const separator = swapped.includes('?') ? '&' : '?';
                    const token = localStorage.getItem('auth_token')?.replace(/"/g, '');
                    return token ? `${swapped}${separator}access_token=${encodeURIComponent(token)}` : swapped;
                  }
                } catch (e) {
                  return swapped;
                }
                return swapped;
              }
            } catch (e) {
              return url;
            }
            return url;
          }

          // Relative paths -> prefix with message service base and append auth token
          const msgBaseStr = getMessageApiUrl().replace(/\/$/, '');
          const full = `${msgBaseStr}${url.startsWith('/') ? '' : '/'}${url}`;
          return appendAuthToken(full);
        } catch (e) {
          return url;
        }
      };

      const mapped: MessageFull[] = rows.map(r => ({
        id: r.id,
        room_id: r.room_id,
        sender_id: r.sender_id,
        ciphertext: r.ciphertext,
        created_at: r.created_at,
        _status: 'sent',
        attachments: (r as any).attachments ? (r as any).attachments.map((a: any) => ({ ...a, url: resolveAttachmentUrl(a.url) })) : null,
        attachment_url: resolveAttachmentUrl((r as any).attachment_url ?? null),
        attachment_urls: (r as any).attachment_urls ? (r as any).attachment_urls.map((u: string) => resolveAttachmentUrl(u)) : null,
        pinned: r.pinned,
        reactions: r.reactions,
        // 🔑 CRITICAL: Map E2EE fields from API response for decryption
        // Double Encryption Model: MUST map all 3 fields!
        encrypted_key: r.encrypted_key,
        encrypted_key_recipient: (r as any).encrypted_key_recipient,
        encrypted_key_sender: (r as any).encrypted_key_sender,
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
