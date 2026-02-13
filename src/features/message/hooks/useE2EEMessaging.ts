import { useEffect, useState } from 'react';
import { useE2EEStore } from '@/stores/e2eeStore';
import { encryptMessage, decryptMessage } from '@/features/message/lib/e2ee';
import { callGetRoomMemberPublicKeys, callSetPublicKey } from '@/features/message/services/messageApi';
import type { MessageOut } from '@/features/message/types/message.types';
import { getSentMessagePlaintext, cleanOldMessageCache } from '@/features/message/lib/messageCache';

export interface UseE2EEMessagingProps {
  roomId: string;
  userId: string;
  enabled?: boolean;
}

/**
 * Hook để xử lý E2EE trong messaging
 */
export const useE2EEMessaging = ({ roomId, userId, enabled = true }: UseE2EEMessagingProps) => {
  const [isReady, setIsReady] = useState(false);
  const { keyPair, initialize, getUserPublicKey, setUserPublicKey, isInitialized } = useE2EEStore();

  // Initialize E2EE on mount
  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const init = async () => {
      try {

        // 🧹 Clean old message cache on init
        cleanOldMessageCache();

        // Step 1: Initialize local key pair with user-specific storage
        if (!isInitialized) {
          await initialize(userId);
        }

        // Step 2: Get the current public key from store (wait for it to be available)
        const state = useE2EEStore.getState();
        const currentPublicKey = state.publicKeyString;

        if (!currentPublicKey) {
          throw new Error('Public key not available after initialization');
        }

        // Step 3: Upload public key to server
        try {
          await callSetPublicKey({
            user_id: userId,
            public_key: currentPublicKey,
          });
        } catch (error: any) {
          // If already exists, it's fine
          if (error?.response?.status !== 409) {
            console.error('[E2EE] ❌ Failed to upload public key:', error);
          } else {
          }
        }

        // Step 4: Fetch public keys of all room members
        if (roomId) {
          try {
            const response = await callGetRoomMemberPublicKeys(roomId);
            const members = response.data?.members || [];

            let foundRecipientKey = false;
            members.forEach(member => {
              if (member.user_id !== userId && member.public_key) {
                setUserPublicKey(member.user_id, member.public_key);
                foundRecipientKey = true;
              }
            });

            if (!foundRecipientKey) {
            }

          } catch (error) {
            console.error('[E2EE] ❌ Failed to load member public keys:', error);
          }
        }

        setIsReady(true);
      } catch (error) {
        console.error('[E2EE] ❌ Initialization failed:', error);
        setIsReady(false);
      }
    };

    init();
  }, [roomId, userId, enabled, isInitialized, initialize, setUserPublicKey]);

  /**
   * Encrypt a message for a specific recipient
   */
  const encryptForRecipient = async (plaintext: string, recipientId: string) => {
    if (!enabled || !isReady) {
      return null;
    }

    try {
      // Debug: Verify we're not encrypting for ourselves
      const currentState = useE2EEStore.getState();

      if (currentState.currentUserId === recipientId) {
        console.error('[E2EE] ❌ FATAL ERROR: Trying to encrypt for YOURSELF!');
        console.error('[E2EE] This is a bug - you should never encrypt for yourself');
        return null;
      }

      // Try to get recipient's public key
      let recipientPublicKey = await getUserPublicKey(recipientId);

      // If not found, retry fetching from server
      if (!recipientPublicKey && roomId) {
        try {
          const response = await callGetRoomMemberPublicKeys(roomId);
          const members = response.data?.members || [];

          const recipientMember = members.find(m => m.user_id === recipientId);

          if (recipientMember?.public_key) {
            setUserPublicKey(recipientId, recipientMember.public_key);
            recipientPublicKey = await getUserPublicKey(recipientId);
          }
        } catch (error) {
          console.error('[E2EE] ❌ Failed to fetch recipient public key:', error);
        }
      }

      if (!recipientPublicKey) {
        console.error('[E2EE] ❌ No public key for recipient:', recipientId, '- They may not have initialized E2EE yet');
        return null;
      }

      const encrypted = await encryptMessage(plaintext, recipientPublicKey);
      // Normalize keys to snake_case so the rest of the app / API receives
      // `encrypted_key` and `iv` (server and useChat expect snake_case)
      return {
        ciphertext: encrypted.ciphertext,
        encrypted_key: (encrypted as any).encryptedKey || (encrypted as any).encrypted_key,
        iv: encrypted.iv,
      };
    } catch (error) {
      console.error('[E2EE] ❌ Encryption failed:', error);
      return null;
    }
  };

  /**
   * Decrypt an incoming message
   */
  const decryptIncoming = async (message: MessageOut): Promise<string | null> => {

    if (!enabled || !isReady || !keyPair) {
      return message.message || message.ciphertext || null;
    }

    const currentUserId = useE2EEStore.getState().currentUserId;
    const isMine = message.sender_id === currentUserId;

    // 🔑 PRIORITY 1: If this is my own message, try to get plaintext from cache
    if (isMine) {

      // Try _plaintext first (in-memory, recent messages)
      if ((message as any)._plaintext) {
        return (message as any)._plaintext;
      }

      // Try cache (after reload)
      const cachedPlaintext = getSentMessagePlaintext(message.id, currentUserId);
      if (cachedPlaintext) {
        return cachedPlaintext;
      }

      // No cache, cannot decrypt (encrypted for recipient)

      if (message.message) {
        return message.message;
      }
      return `[Tin nhắn đã gửi - không thể hiển thị sau reload]`;
    }

    // Check if message has E2EE fields
    if (!message.encrypted_key || !message.iv || !message.ciphertext) {
      return message.message || message.ciphertext || null;
    }

    // This is someone else's message TO ME - decrypt it!

    try {
      const decrypted = await decryptMessage(message.ciphertext, message.encrypted_key, message.iv, keyPair.privateKey);
      return decrypted;
    } catch (error) {
      console.error('\n❌❌❌ DECRYPTION FAILED ❌❌❌');
      console.error('[E2EE decrypt] Message ID:', message.id);
      console.error('[E2EE decrypt] Sent by:', message.sender_id?.substring(0, 8) + '...');
      console.error('[E2EE decrypt] I am:', currentUserId?.substring(0, 8) + '...');
      console.error('[E2EE decrypt] Error:', error);
      console.error('[E2EE decrypt] 💡 POSSIBLE CAUSES:');
      console.error('  1. OLD MESSAGE: Encrypted with old keys before you regenerated');
      console.error('  2. WRONG RECIPIENT: Sender encrypted for someone else, not you');
      console.error('  3. KEY MISMATCH: Sender used your OLD public key');
      console.error('  4. CORRUPT DATA: encrypted_key or iv corrupted');
      console.error('\n🔧 HOW TO FIX:');
      console.error('  - Ask sender to send a NEW message (not old ones)');
      console.error('  - Both users clear localStorage and regenerate E2EE keys');
      console.error('  - Check sender encrypted for YOUR user_id');
      console.error('==================================================================\n');
      return '🔒 [Không thể giải mã - tin nhắn không dành cho bạn hoặc key không khớp]';
    }
  };

  /**
   * Decrypt multiple messages
   */
  const decryptMessages = async (messages: MessageOut[]): Promise<Array<MessageOut & { decryptedText?: string }>> => {
    if (!enabled || !isReady) {
      return messages;
    }

    const decrypted = await Promise.all(
      messages.map(async msg => {
        const decryptedText = await decryptIncoming(msg);
        return {
          ...msg,
          decryptedText: decryptedText || undefined,
        };
      })
    );

    return decrypted;
  };

  return {
    isReady,
    encryptForRecipient,
    decryptIncoming,
    decryptMessages,
  };
};
