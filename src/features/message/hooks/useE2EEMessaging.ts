import { useEffect, useState } from 'react';
import { useE2EEStore } from '@/stores/e2eeStore';
import { encryptMessageForBoth, decryptMessage } from '@/features/message/lib/e2ee';
import { callGetRoomMemberPublicKeys, callSetPublicKey, callUpdatePublicKey } from '@/features/message/services/messageApi';
import type { MessageOut } from '@/features/message/types/message.types';

export interface UseE2EEMessagingProps {
  roomId: string;
  userId: string;
  enabled?: boolean;
}

/**
 * Hook xử lý E2EE sử dụng RSA KEYPAIR EXCHANGE
 *
 * ARCHITECTURE (CHUẨN):
 * 1. Mỗi user có RSA keypair (public/private) - persist trong localStorage
 * 2. Public keys được share qua backend
 * 3. Sender encrypt tin nhắn:
 *    - Generate random AES key
 *    - Encrypt message bằng AES key
 *    - Encrypt AES key bằng RECIPIENT's PUBLIC KEY
 * 4. Recipient decrypt:
 *    - Decrypt AES key bằng PRIVATE KEY của mình
 *    - Decrypt message bằng AES key
 * 5. Sender KHÔNG decrypt được tin của mình (đúng với E2EE!)
 *    - Hiển thị từ message.message field (plaintext từ backend)
 *    - Hoặc dùng _plaintext trong memory (optimistic update)
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
        console.log(`\n🔐 ==================== E2EE INIT ====================`);
        console.log(`[E2EE] User: ${userId.substring(0, 8)}...`);
        console.log(`[E2EE] Room: ${roomId.substring(0, 8)}...`);
        console.log(`[E2EE] Architecture: RSA Keypair Exchange`);
        console.log(`=====================================================\n`);

        // Step 1: Initialize local RSA keypair
        if (!isInitialized) {
          await initialize(userId);
          console.log(`[E2EE] ✅ RSA keypair initialized`);
        }

        // Step 2: Get my public key
        const state = useE2EEStore.getState();
        const myPublicKey = state.publicKeyString;

        if (!myPublicKey) {
          throw new Error('Public key not available after initialization');
        }

        // Step 3: Upload public key to backend (ALWAYS overwrite if exists)
        try {
          await callSetPublicKey({
            user_id: userId,
            public_key: myPublicKey,
          });
          console.log('[E2EE] ✅ Public key uploaded to backend');
        } catch (error: any) {
          if (error?.response?.status === 409) {
            // Key already exists → UPDATE/OVERWRITE with new key
            console.log('[E2EE] ⚠️ Public key conflict - attempting to UPDATE with new key...');
            try {
              await callUpdatePublicKey({
                user_id: userId,
                public_key: myPublicKey,
              });
              console.log('[E2EE] ✅ Public key UPDATED successfully (overwrote old key)');
            } catch (updateError) {
              console.error('[E2EE] ❌ Failed to UPDATE public key:', updateError);
              console.error('[E2EE] 🚨 CRITICAL: New public key NOT saved to backend!');
              console.error('[E2EE] 🚨 Other users will encrypt with OLD key → you CANNOT decrypt!');
            }
          } else {
            console.error('[E2EE] ❌ Failed to upload public key:', error);
          }
        }

        // Step 4: Fetch public keys of room members
        if (roomId) {
          try {
            const response = await callGetRoomMemberPublicKeys(roomId);
            const members = response.data?.members || [];

            console.log(`[E2EE] 📦 Found ${members.length} room members`);

            members.forEach(member => {
              if (member.user_id !== userId && member.public_key) {
                setUserPublicKey(member.user_id, member.public_key);
                console.log(`[E2EE] 🔑 Loaded public key for: ${member.user_id.substring(0, 8)}...`);
              }
            });
          } catch (error) {
            console.error('[E2EE] ❌ Failed to load member public keys:', error);
          }
        }

        setIsReady(true);
        console.log(`✅ [E2EE] Ready for encrypted messaging\n`);
      } catch (error) {
        console.error('❌ [E2EE] Initialization failed:', error);
        setIsReady(false);
      }
    };

    init();
  }, [roomId, userId, enabled, isInitialized, initialize, setUserPublicKey]);

  /**
   * Encrypt tin nhắn cho CẢ RECIPIENT VÀ SENDER (Double Encryption)
   * - Generate random AES key
   * - Encrypt message bằng AES
   * - Encrypt AES key 2 LẦN:
   *   1. Bằng RECIPIENT's PUBLIC KEY
   *   2. Bằng SENDER's PUBLIC KEY (chính mình!)
   *
   * Như vậy cả 2 bên đều decrypt được!
   */
  const encryptForRecipient = async (plaintext: string, recipientId: string) => {
    if (!enabled || !isReady || !keyPair) {
      console.warn('[E2EE] ⚠️ Cannot encrypt - E2EE not ready');
      return null;
    }

    try {
      console.log(`\n🔐 [E2EE] Encrypting for BOTH recipient and sender...`);
      console.log(`   Recipient: ${recipientId.substring(0, 8)}...`);

      // 🚨 CRITICAL FIX: ALWAYS fetch FRESH public key from server!
      // Cache có thể bị stale nếu recipient clear localStorage hoặc login từ device khác
      // → PHẢI refetch để đảm bảo dùng public key MỚI NHẤT!
      let recipientPublicKey: CryptoKey | null = null;
      let retries = 0;
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000; // 1 second

      if (roomId) {
        // Retry logic: Đôi khi recipient chưa POST public key lên backend (race condition)
        while (retries < MAX_RETRIES && !recipientPublicKey) {
          console.log(`[E2EE] 🔄 Fetching FRESH recipient public key (attempt ${retries + 1}/${MAX_RETRIES})...`);

          try {
            const response = await callGetRoomMemberPublicKeys(roomId);
            const members = response.data?.members || [];
            const recipientMember = members.find(m => m.user_id === recipientId);

            if (recipientMember?.public_key) {
              // Update cache with FRESH key
              setUserPublicKey(recipientId, recipientMember.public_key);
              recipientPublicKey = await getUserPublicKey(recipientId);
              console.log('[E2EE] ✅ Fetched FRESH recipient public key from server');
              break; // Success!
            } else {
              console.warn(`[E2EE] ⚠️ Recipient not found or no public key (attempt ${retries + 1}/${MAX_RETRIES})`);
              console.warn(`[E2EE]    Total members: ${members.length}, Looking for: ${recipientId.substring(0, 8)}...`);

              if (retries < MAX_RETRIES - 1) {
                console.log(`[E2EE] ⏳ Waiting ${RETRY_DELAY}ms before retry (recipient may still be initializing E2EE)...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                retries++;
              } else {
                break; // Max retries reached
              }
            }
          } catch (error) {
            console.error(`[E2EE] ❌ Failed to fetch public key (attempt ${retries + 1}/${MAX_RETRIES}):`, error);

            if (retries < MAX_RETRIES - 1) {
              console.log(`[E2EE] ⏳ Waiting ${RETRY_DELAY}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              retries++;
            } else {
              // Last resort: Try cache
              console.log('[E2EE] 🔄 All fetch attempts failed, trying cached public key...');
              recipientPublicKey = await getUserPublicKey(recipientId);
              break;
            }
          }
        }
      } else {
        // No roomId - use cache only (should not happen in production)
        console.warn('[E2EE] ⚠️ No roomId, using cached public key');
        recipientPublicKey = await getUserPublicKey(recipientId);
      }

      if (!recipientPublicKey) {
        console.error('[E2EE] ❌ No public key for recipient after all retries:', recipientId);
        console.error('[E2EE] 🚨 POSSIBLE CAUSES:');
        console.error('[E2EE]    1. Recipient has not initialized E2EE yet (not generated keypair)');
        console.error("[E2EE]    2. Recipient's public key not uploaded to backend");
        console.error('[E2EE]    3. Backend API /api/rooms/{room_id}/members/public_keys not working');
        console.error('[E2EE]    4. Wrong recipientId (not in this room)');
        return null;
      }

      // Get MY public key (to encrypt for myself)
      const state = useE2EEStore.getState();
      const myPublicKeyString = state.publicKeyString;
      if (!myPublicKeyString) {
        console.error('[E2EE] ❌ My public key not available');
        return null;
      }

      const { importPublicKey } = await import('@/features/message/lib/e2ee');
      const myPublicKey = await importPublicKey(myPublicKeyString);

      console.log('[E2EE] 🔑 Got both public keys, encrypting...');

      // DOUBLE ENCRYPT: cho recipient + cho chính mình
      const encrypted = await encryptMessageForBoth(plaintext, recipientPublicKey, myPublicKey);

      console.log(`✅ [E2EE] Double encryption successful!`);
      console.log(`   Ciphertext: ${encrypted.ciphertext.length} chars`);
      console.log(`   Key for recipient: ${encrypted.encrypted_key_recipient.length} chars`);
      console.log(`   Key for sender: ${encrypted.encrypted_key_sender.length} chars`);
      console.log(`   IV: ${encrypted.iv.length} chars\n`);

      return {
        ciphertext: encrypted.ciphertext,
        encrypted_key_recipient: encrypted.encrypted_key_recipient,
        encrypted_key_sender: encrypted.encrypted_key_sender,
        iv: encrypted.iv,
      };
    } catch (error) {
      console.error('❌ [E2EE] Encryption failed:', error);
      return null;
    }
  };

  /**
   * Decrypt tin nhắn
   * - CẢ SENDER VÀ RECIPIENT đều decrypt được!
   * - Sender dùng encrypted_key_sender
   * - Recipient dùng encrypted_key (hoặc encrypted_key_recipient)
   */
  const decryptIncoming = async (message: MessageOut): Promise<string | null> => {
    if (!enabled || !isReady || !keyPair) {
      return message.message || message.ciphertext || null;
    }

    const currentUserId = useE2EEStore.getState().currentUserId;
    const isMine = message.sender_id === currentUserId;

    // Check if message has E2EE fields
    if (!message.ciphertext || !message.iv) {
      console.warn('[E2EE] ⚠️ Message missing ciphertext or iv:', message.id);
      // Try _plaintext or message field
      if ((message as any)._plaintext) {
        return (message as any)._plaintext;
      }
      return message.message || message.ciphertext || null;
    }

    // Determine which encrypted_key to use
    let encryptedKeyToUse: string | null = null;

    if (isMine) {
      // I'm the sender - use encrypted_key_sender
      encryptedKeyToUse = (message as any).encrypted_key_sender || null;

      // Fallback: nếu chưa có encrypted_key_sender (old messages), dùng _plaintext
      if (!encryptedKeyToUse) {
        if ((message as any)._plaintext) {
          console.log('[E2EE] ℹ️ Using _plaintext for my old message');
          return (message as any)._plaintext;
        }
        if (message.message) {
          return message.message;
        }
        console.log('[E2EE] ⚠️ My message but no encrypted_key_sender - old format');
        return '[Tin đã gửi - format cũ]';
      }

      console.log(`🔓 [E2EE] Decrypting MY message ${message.id.substring(0, 8)}... (using encrypted_key_sender)`);
      console.log(`   encrypted_key_sender length: ${encryptedKeyToUse.length}`);
      console.log(`   FULL encrypted_key_sender: ${encryptedKeyToUse}`);
    } else {
      // I'm the recipient - use encrypted_key or encrypted_key_recipient
      encryptedKeyToUse = (message as any).encrypted_key_recipient || message.encrypted_key || null;

      if (!encryptedKeyToUse) {
        console.warn('[E2EE] ⚠️ No encrypted_key for recipient in message:', message.id);
        return message.message || '🔒 [Không thể giải mã - thiếu key]';
      }

      console.log(`🔓 [E2EE] Decrypting message from ${message.sender_id?.substring(0, 8)}... (using encrypted_key_recipient)`);
      console.log(`   encrypted_key length: ${encryptedKeyToUse.length}`);
      console.log(`   FULL encrypted_key: ${encryptedKeyToUse}`);
    }

    // Decrypt
    try {
      const decrypted = await decryptMessage(message.ciphertext, encryptedKeyToUse, message.iv, keyPair.privateKey);

      console.log(`✅ [E2EE] Decryption successful!`);
      return decrypted;
    } catch (error) {
      console.error(`❌ [E2EE] Decryption failed for message ${message.id}:`, error);
      console.error(`   Is mine:`, isMine);
      console.error(`   Used key type:`, isMine ? 'encrypted_key_sender' : 'encrypted_key_recipient');
      console.error(`   encrypted_key used (first 100 chars):`, encryptedKeyToUse?.substring(0, 100));

      // Check if this is OperationError (wrong key)
      if (error instanceof Error && error.name === 'OperationError') {
        console.error(`   🚨 OperationError = Message encrypted with OLD PUBLIC KEY!`);
        console.error(`   This happens when:`);
        console.error(`   1. You cleared localStorage and generated NEW keypair`);
        console.error(`   2. But this message was encrypted with OLD public key`);
        console.error(`   3. NEW private key CANNOT decrypt OLD encrypted keys`);
        console.error(`   ❌ Solution: This old message is PERMANENTLY UNREADABLE`);

        return '🔒 [Tin nhắn cũ - đã reset khóa]';
      }

      console.error(`   Possible causes:`);
      console.error(`   1. Message encrypted for someone else`);
      console.error(`   2. Sender used old public key`);
      console.error(`   3. Corrupted data`);

      return '🔒 [Không thể giải mã]';
    }
  };

  /**
   * Decrypt nhiều tin nhắn
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
