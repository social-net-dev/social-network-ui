import { useEffect, useState } from 'react';
import { useE2EEStore } from '@/stores/e2eeStore';
import { encryptMessageForBoth, decryptMessage, exportPrivateKey, importPrivateKey, importPublicKey, encryptPrivateKeyWithPassphrase, decryptPrivateKeyWithPassphrase, saveKeyPair } from '@/features/message/lib/e2ee';
import { callGetRoomMemberPublicKeys, callSetPublicKey, callUpdatePublicKey, callBackupPrivateKey, callGetPrivateKeyBackup, callGetUserPublicKey } from '@/features/message/services/messageApi';
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
  const [showSyncNotice, setShowSyncNotice] = useState(false);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseMode, setPassphraseMode] = useState<'create' | 'restore' | null>(null);
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

        // Helper to determine whether a backup exists in various response shapes
        const hasBackup = (resp: any) => {
          if (!resp || !resp.data) return false;
          const d = resp.data;
          if (Array.isArray(d.backups)) return d.backups.length > 0;
          if (typeof d === 'object' && (d.ciphertext || d.backup || d.payload)) return true;
          return false;
        };

        // Step 1: Check server-side backup BEFORE generating local keys.
        // If a private-key backup exists on the backend, do NOT auto-generate
        // a new keypair on this device — prompt the user to restore instead.
        try {
          const backupBeforeInit = await callGetPrivateKeyBackup(userId).catch(err => {
            console.warn('[E2EE] callGetPrivateKeyBackup error:', err);
            return null;
          });

          console.log('[E2EE] Backup check response (before init):', backupBeforeInit?.data);
          console.log('[E2EE] isInitialized flag before init:', isInitialized);
          const localPrivateBefore = !!localStorage.getItem(`e2ee_private_key_${userId}`);
          console.log('[E2EE] local private key exists before init:', localPrivateBefore);

          if (hasBackup(backupBeforeInit)) {
            console.log('[E2EE] 🔁 Backup exists on server; attempting auto-restore if passphrase persisted');
            try {
              const persisted = localStorage.getItem(`e2ee_passphrase_${userId}`) ?? sessionStorage.getItem(`e2ee_passphrase_${userId}`) ?? null;
              if (persisted) {
                try {
                  await handleRestore(persisted, true);
                  console.log('[E2EE] ✅ Auto-restore succeeded during init');
                  // proceed as initialized
                  setIsReady(true);
                  return;
                } catch (err) {
                  console.warn('[E2EE] Auto-restore with persisted passphrase failed during init', err);
                }
              }
            } catch (e) {
              console.warn('[E2EE] Error checking persisted passphrase during init', e);
            }

            console.log('[E2EE] 🔁 No persisted passphrase or auto-restore failed; requesting manual restore');
            setPassphraseMode('restore');
            setShowPassphraseModal(true);
            setIsReady(false);
            return; // bail out of init - wait for user to restore
          }
        } catch (e) {
          console.warn('[E2EE] Could not check server backup before init, proceeding to initialize local keys', e);
        }

        // Step 2: Initialize local RSA keypair
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

        // Check backup status: if server has a backup and local keys are missing -> require restore
        try {
          const storageKeys = `e2ee_private_key_${userId}`;
          const localPrivate = localStorage.getItem(storageKeys);
          const backupResp = await callGetPrivateKeyBackup(userId).catch(() => null);

          if (!localPrivate && hasBackup(backupResp)) {
            console.log('[E2EE] 🔁 Local private key missing but backup exists -> need restore');
            setPassphraseMode('restore');
            setShowPassphraseModal(true);
          } else if (localPrivate && !hasBackup(backupResp)) {
            // Local key exists but no backup -> prompt user to create passphrase/backup (only when they open messages)
            console.log('[E2EE] 🔐 Local key exists but no backup on server -> suggest creating backup');
            // Defer showing modal to UI (ConversationPage) by setting mode create but not auto-open here; ConversationPage can open
            // For convenience, open modal now so user can back up immediately
            setPassphraseMode('create');
            setShowPassphraseModal(true);
          } else if (localPrivate && hasBackup(backupResp)) {
            // Backup exists on server and local key exists -> show a one-time sync notice per device
            try {
              const seenKey = `e2ee_sync_seen_${userId}`;
              const seen = localStorage.getItem(seenKey);
              if (!seen) {
                setShowSyncNotice(true);
                localStorage.setItem(seenKey, '1');
              }
            } catch (e) {
              console.warn('Failed to set sync-seen flag', e);
            }
          }
        } catch (e) {
          console.warn('[E2EE] Could not check backup status', e);
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

  // Ensure ready helper: attempt to initialize now (used when user sends before auto-init completes)
  const ensureReady = async (): Promise<boolean> => {
    if (!enabled) return false;
    if (isReady) return true;

    try {
      console.log('[E2EE] ensureReady: attempting on-demand initialization');

      // Check backup first
      const backupResp = await callGetPrivateKeyBackup(userId).catch(() => null);
      const has = (resp: any) => {
        if (!resp || !resp.data) return false;
        if (Array.isArray(resp.data.backups)) return resp.data.backups.length > 0;
        if (typeof resp.data === 'object' && (resp.data.ciphertext || resp.data.backup || resp.data.payload)) return true;
        return false;
      };

      if (has(backupResp) && !localStorage.getItem(`e2ee_private_key_${userId}`)) {
        console.log('[E2EE] ensureReady: backup exists and local key missing => attempting auto-restore if passphrase persisted');
        // Try persisted passphrase (localStorage first, then sessionStorage)
        try {
          const persisted = localStorage.getItem(`e2ee_passphrase_${userId}`) ?? sessionStorage.getItem(`e2ee_passphrase_${userId}`) ?? null;
          if (persisted) {
            console.log('[E2EE] ensureReady: found persisted passphrase; attempting auto-restore');
            try {
              await handleRestore(persisted, true);
              console.log('[E2EE] ensureReady: auto-restore succeeded');
              return true;
            } catch (err) {
              console.warn('[E2EE] ensureReady: auto-restore failed with persisted passphrase', err);
            }
          }
        } catch (e) {
          console.warn('[E2EE] ensureReady: error reading persisted passphrase', e);
        }

        // No persisted passphrase or auto-restore failed -> prompt user to restore
        setPassphraseMode('restore');
        setShowPassphraseModal(true);
        return false;
      }

      // Perform initialization (generate or load keys)
      if (!isInitialized) {
        await initialize(userId);
      }

      // Upload public key
      const s = useE2EEStore.getState();
      const myPublicKey = s.publicKeyString;
      if (myPublicKey) {
        try {
          await callSetPublicKey({ user_id: userId, public_key: myPublicKey });
        } catch (e) {
          try {
            await callUpdatePublicKey({ user_id: userId, public_key: myPublicKey });
          } catch (e2) {
            console.warn('[E2EE] ensureReady: failed to upload public key', e2);
          }
        }
      }

      // Fetch room member public keys
      if (roomId) {
        try {
          const res = await callGetRoomMemberPublicKeys(roomId).catch(() => null);
          const members = res?.data?.members || [];
          members.forEach((m: any) => {
            if (m.user_id !== userId && m.public_key) {
              setUserPublicKey(m.user_id, m.public_key);
            }
          });
        } catch (e) {
          console.warn('[E2EE] ensureReady: failed to fetch member public keys', e);
        }
      }

      setIsReady(true);
      return true;
    } catch (e) {
      console.warn('[E2EE] ensureReady failed', e);
      return false;
    }
  };

  // Handlers for passphrase modal
  const handleCreateBackup = async (passphrase: string, remember: boolean) => {
    if (!keyPair) throw new Error('No keyPair to backup');
    const exportedPriv = await exportPrivateKey(keyPair.privateKey);
    const payload = await encryptPrivateKeyWithPassphrase(exportedPriv, passphrase);
    await callBackupPrivateKey(userId, payload);
    try {
      if (remember) {
        localStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
      } else {
        sessionStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
      }
    } catch (e) {
      console.warn('[E2EE] Failed to persist passphrase on device', e);
    }
    setShowPassphraseModal(false);
    setPassphraseMode(null);
    console.log('[E2EE] ✅ Backup created on server');
  };

  const handleRestore = async (passphrase: string, remember = false) => {
    const resp = await callGetPrivateKeyBackup(userId);
    if (!resp || !resp.data) throw new Error('No backup found');
    const payload = resp.data;
    // Support different shapes: { backups: [...] } or { ciphertext, iv, salt }
    if (Array.isArray(payload.backups) && payload.backups.length === 0) {
      throw new Error('No backup found');
    }
    const exportedPrivateBase64 = await decryptPrivateKeyWithPassphrase(payload, passphrase);
    // Import private key
    const privateKey = await importPrivateKey(exportedPrivateBase64);

    // Try to fetch public key from server (should exist)
    let publicKeyCrypto: CryptoKey | null = null;
    try {
      const pubResp = await callGetUserPublicKey(userId);
      let pubStr: string | undefined;
      if (pubResp && pubResp.data) {
        if (typeof pubResp.data === 'string') pubStr = pubResp.data;
        else if ((pubResp.data as any).public_key) pubStr = (pubResp.data as any).public_key;
      }

      if (pubStr) {
        publicKeyCrypto = await importPublicKey(pubStr);
      } else {
        throw new Error('No public key found on server');
      }
    } catch (err) {
      console.warn('[E2EE] Could not fetch public key from server during restore', err);
      throw new Error('Cannot restore: public key missing on server');
    }

    // Save the restored keypair (publicKeyCrypto + privateKey)
    await saveKeyPair({ publicKey: publicKeyCrypto, privateKey }, userId);

    // Remember passphrase on device if requested
    try {
      if (remember) localStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
      else sessionStorage.setItem(`e2ee_passphrase_${userId}`, passphrase);
    } catch (e) {
      console.warn('[E2EE] Failed to persist passphrase after restore', e);
    }

    // Mark this device as having seen sync so overlay won't re-appear
    try {
      localStorage.setItem(`e2ee_sync_seen_${userId}`, '1');
    } catch (e) {
      console.warn('[E2EE] Failed to set e2ee_sync_seen flag', e);
    }

    setShowPassphraseModal(false);
    setPassphraseMode(null);
    setIsReady(true);
    console.log('[E2EE] ✅ Restore complete');
  };

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
    // Passphrase/backup helpers
    showPassphraseModal,
    passphraseMode,
    setShowPassphraseModal,
    setPassphraseMode,
    handleCreateBackup,
    handleRestore,
    showSyncNotice,
    dismissSyncNotice: () => setShowSyncNotice(false),
    // Ensure ready on-demand (init + upload pubkey + fetch member keys)
    ensureReady,
  } as any;
};
