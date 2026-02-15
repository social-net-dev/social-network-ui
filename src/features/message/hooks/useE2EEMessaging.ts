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

export const useE2EEMessaging = ({ roomId, userId, enabled = true }: UseE2EEMessagingProps) => {
  const [isReady, setIsReady] = useState(false);
  const [showSyncNotice, setShowSyncNotice] = useState(false);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseMode, setPassphraseMode] = useState<'create' | 'restore' | null>(null);
  const { keyPair, initialize, getUserPublicKey, setUserPublicKey, isInitialized } = useE2EEStore();

  // Helper to detect backup shape
  const hasBackupShape = (resp: any) => {
    if (!resp || !resp.data) return false;
    const d = resp.data;
    if (Array.isArray(d.backups)) return d.backups.length > 0;
    if (typeof d === 'object' && (d.ciphertext || d.backup || d.payload)) return true;
    return false;
  };

  useEffect(() => {
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const init = async () => {
      try {
        console.log('\n🔐 ==================== E2EE INIT ====================');
        console.log(`[E2EE] User: ${userId?.substring(0, 8)}...`);
        console.log(`[E2EE] Room: ${roomId?.substring(0, 8)}...`);
        console.log('=====================================================\n');

        // Step 1: check server backup BEFORE generating local keys
        try {
          const storageKey = `e2ee_private_key_${userId}`;
          const localPrivate = localStorage.getItem(storageKey);
          const backupBeforeInit = await callGetPrivateKeyBackup(userId).catch(() => null);
          // Only prompt for manual restore if a server backup exists AND we don't have a local private key
          if (!localPrivate && hasBackupShape(backupBeforeInit)) {
            console.log('[E2EE] 🔁 Backup exists on server and no local key found; requesting manual restore (no auto-restore)');
            setPassphraseMode('restore');
            setShowPassphraseModal(true);
            setIsReady(false);
            return;
          }
        } catch (e) {
          console.warn('[E2EE] Could not check server backup before init', e);
        }

        // Step 2: initialize local keypair if needed
        if (!isInitialized) {
          await initialize(userId);
          console.log('[E2EE] ✅ RSA keypair initialized');
        }

        // Step 3: ensure my public key is uploaded
        const state = useE2EEStore.getState();
        const myPublicKey = state.publicKeyString;
        if (!myPublicKey) throw new Error('Public key not available after initialization');

        try {
          await callSetPublicKey({ user_id: userId, public_key: myPublicKey });
          console.log('[E2EE] ✅ Public key uploaded to backend');
        } catch (err: any) {
          if (err?.response?.status === 409) {
            console.log('[E2EE] ⚠️ Public key conflict - attempting to UPDATE');
            try {
              await callUpdatePublicKey({ user_id: userId, public_key: myPublicKey });
              console.log('[E2EE] ✅ Public key UPDATED successfully');
            } catch (uErr) {
              console.error('[E2EE] ❌ Failed to UPDATE public key:', uErr);
            }
          } else {
            console.error('[E2EE] ❌ Failed to upload public key:', err);
          }
        }

        // Step 4: fetch member public keys for the room
        if (roomId) {
          try {
            const resp = await callGetRoomMemberPublicKeys(roomId).catch(() => null);
            const members = resp?.data?.members || [];
            members.forEach(m => {
              if (m.user_id !== userId && m.public_key) setUserPublicKey(m.user_id, m.public_key);
            });
          } catch (e) {
            console.warn('[E2EE] Could not fetch room member public keys', e);
          }
        }

        // Check backup status to show sync/create prompts
        try {
          const storageKey = `e2ee_private_key_${userId}`;
          const localPrivate = localStorage.getItem(storageKey);
          const backupResp = await callGetPrivateKeyBackup(userId).catch(() => null);
          if (!localPrivate && hasBackupShape(backupResp)) {
            console.log('[E2EE] 🔁 Local private key missing but backup exists -> require restore');
            setPassphraseMode('restore');
            setShowPassphraseModal(true);
          } else if (localPrivate && !hasBackupShape(backupResp)) {
            console.log('[E2EE] 🔐 Local key exists but no backup -> suggest creating backup');
            setPassphraseMode('create');
            setShowPassphraseModal(true);
          } else if (localPrivate && hasBackupShape(backupResp)) {
            try {
              const seenKey = `e2ee_sync_seen_${userId}`;
              if (!localStorage.getItem(seenKey)) {
                setShowSyncNotice(true);
                localStorage.setItem(seenKey, '1');
              }
            } catch (e) {
              console.warn('[E2EE] Failed to set sync-seen flag', e);
            }
          }
        } catch (e) {
          console.warn('[E2EE] Could not check backup status', e);
        }

        setIsReady(true);
        console.log('✅ [E2EE] Ready for encrypted messaging\n');
      } catch (error) {
        console.error('❌ [E2EE] Initialization failed:', error);
        setIsReady(false);
      }
    };

    init();
  }, [roomId, userId, enabled, isInitialized, initialize, setUserPublicKey]);

  const ensureReady = async (): Promise<boolean> => {
    if (!enabled) return false;
    if (isReady) return true;

    try {
      console.log('[E2EE] ensureReady: attempting on-demand initialization');
      const backupResp = await callGetPrivateKeyBackup(userId).catch(() => null);
      if (hasBackupShape(backupResp) && !localStorage.getItem(`e2ee_private_key_${userId}`)) {
        // require manual restore
        setPassphraseMode('restore');
        setShowPassphraseModal(true);
        return false;
      }

      if (!isInitialized) await initialize(userId);

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

      if (roomId) {
        try {
          const res = await callGetRoomMemberPublicKeys(roomId).catch(() => null);
          const members = res?.data?.members || [];
          // If we already have a local private key saved, no need to force the modal again.
          const storageKey = `e2ee_private_key_${userId}`;
          const localPrivate = localStorage.getItem(storageKey);
          const seenKey = `e2ee_sync_seen_${userId}`;
          const seen = localStorage.getItem(seenKey);

          if (localPrivate) {
            console.log('[E2EE] Backup exists but local private key is present -> initializing from local keys');
            try {
              await initialize(userId);
              setIsReady(true);
              return true;
            } catch (e) {
              console.warn('[E2EE] Initialization from local keys failed, will prompt restore', e);
              // fallthrough to prompt restore
            }
          }

          // If user has already seen sync and still has no local key, still prompt restore.
          console.log('[E2EE] 🔁 Backup exists on server; requesting manual restore (no auto-restore)');
          setPassphraseMode('restore');
          setShowPassphraseModal(true);
          setIsReady(false);
          return false; // bail out of init - wait for user to restore
        } catch (e) {
          console.warn('[E2EE] ensureReady room/member check failed', e);
        }
      }

      setIsReady(true);
      return true;
    } catch (e) {
      console.warn('[E2EE] ensureReady failed', e);
      return false;
    }
  };

  const handleCreateBackup = async (passphrase: string, remember: boolean) => {
    if (!keyPair) throw new Error('No keyPair to backup');
    const exportedPriv = await exportPrivateKey(keyPair.privateKey);
    const payload = await encryptPrivateKeyWithPassphrase(exportedPriv, passphrase);
    await callBackupPrivateKey(userId, payload);
    // Do NOT persist passphrase on device
    setShowPassphraseModal(false);
    setPassphraseMode(null);
    console.log('[E2EE] ✅ Backup created on server');
  };

  const handleRestore = async (passphrase: string, remember = false) => {
    const resp = await callGetPrivateKeyBackup(userId);
    if (!resp || !resp.data) throw new Error('No backup found');
    const payload = resp.data;
    if (Array.isArray(payload.backups) && payload.backups.length === 0) throw new Error('No backup found');

    const exportedPrivateBase64 = await decryptPrivateKeyWithPassphrase(payload, passphrase);
    const privateKey = await importPrivateKey(exportedPrivateBase64);

    // fetch public key from server to pair
    let publicKeyCrypto: CryptoKey | null = null;
    try {
      const pubResp = await callGetUserPublicKey(userId);
      let pubStr: string | undefined;
      if (pubResp && pubResp.data) {
        if (typeof pubResp.data === 'string') pubStr = pubResp.data;
        else if ((pubResp.data as any).public_key) pubStr = (pubResp.data as any).public_key;
      }

      if (pubStr) publicKeyCrypto = await importPublicKey(pubStr);
      else throw new Error('No public key found on server');
    } catch (err) {
      console.warn('[E2EE] Could not fetch public key from server during restore', err);
      throw new Error('Cannot restore: public key missing on server');
    }

    await saveKeyPair({ publicKey: publicKeyCrypto, privateKey }, userId);

    // Re-initialize in-memory store so `isInitialized` becomes true and we don't re-prompt
    try {
      await initialize(userId);
    } catch (e) {
      console.warn('[E2EE] Failed to initialize store after restore', e);
    }

    // Do NOT persist passphrase on device
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

  const encryptForRecipient = async (plaintext: string, recipientId: string) => {
    if (!enabled || !isReady || !keyPair) {
      console.warn('[E2EE] ⚠️ Cannot encrypt - E2EE not ready');
      return null;
    }

    try {
      let recipientPublicKey: CryptoKey | null = null;
      let retries = 0;
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000;

      if (roomId) {
        while (retries < MAX_RETRIES && !recipientPublicKey) {
          try {
            const response = await callGetRoomMemberPublicKeys(roomId);
            const members = response.data?.members || [];
            const recipientMember = members.find(m => m.user_id === recipientId);
            if (recipientMember?.public_key) {
              setUserPublicKey(recipientId, recipientMember.public_key);
              recipientPublicKey = await getUserPublicKey(recipientId);
              break;
            } else {
              if (retries < MAX_RETRIES - 1) {
                await new Promise(r => setTimeout(r, RETRY_DELAY));
                retries++;
              } else break;
            }
          } catch (error) {
            if (retries < MAX_RETRIES - 1) {
              await new Promise(r => setTimeout(r, RETRY_DELAY));
              retries++;
            } else {
              recipientPublicKey = await getUserPublicKey(recipientId);
              break;
            }
          }
        }
      } else {
        recipientPublicKey = await getUserPublicKey(recipientId);
      }

      if (!recipientPublicKey) return null;

      let myPublicKey: CryptoKey | null = null;
      if (keyPair && (keyPair as any).publicKey) myPublicKey = (keyPair as any).publicKey;
      else {
        const state = useE2EEStore.getState();
        const myPublicKeyString = state.publicKeyString;
        if (!myPublicKeyString) return null;
        const { importPublicKey: importPub } = await import('@/features/message/lib/e2ee');
        myPublicKey = await importPub(myPublicKeyString);
      }

      const encrypted = await encryptMessageForBoth(plaintext, recipientPublicKey, myPublicKey as CryptoKey);
      return {
        ciphertext: encrypted.ciphertext,
        encrypted_key_recipient: encrypted.encrypted_key_recipient,
        encrypted_key_sender: encrypted.encrypted_key_sender,
        iv: encrypted.iv,
      };
    } catch (error) {
      console.error('[E2EE] Encryption failed:', error);
      return null;
    }
  };

  const decryptIncoming = async (message: MessageOut): Promise<string | null> => {
    if (!enabled || !isReady || !keyPair) return message.message || message.ciphertext || null;
    const currentUserId = useE2EEStore.getState().currentUserId;
    const isMine = message.sender_id === currentUserId;

    if (!message.ciphertext || !message.iv) {
      if ((message as any)._plaintext) return (message as any)._plaintext;
      return message.message || message.ciphertext || null;
    }

    let encryptedKeyToUse: string | null = null;
    if (isMine) {
      encryptedKeyToUse = (message as any).encrypted_key_sender || null;
      if (!encryptedKeyToUse) {
        if ((message as any)._plaintext) return (message as any)._plaintext;
        if (message.message) return message.message;
        return '[Tin đã gửi - format cũ]';
      }
    } else {
      encryptedKeyToUse = (message as any).encrypted_key_recipient || message.encrypted_key || null;
      if (!encryptedKeyToUse) return message.message || '🔒 [Không thể giải mã - thiếu key]';
    }

    try {
      const decrypted = await decryptMessage(message.ciphertext, encryptedKeyToUse, message.iv, keyPair.privateKey);
      return decrypted;
    } catch (error) {
      console.error('[E2EE] Decryption failed for message', message.id, error);
      if (error instanceof Error && error.name === 'OperationError') return '🔒 [Tin nhắn cũ - đã reset khóa]';
      return '🔒 [Không thể giải mã]';
    }
  };

  const decryptMessages = async (messages: MessageOut[]) => {
    if (!enabled || !isReady) return messages;
    const decrypted = await Promise.all(messages.map(async msg => ({ ...(msg as any), decryptedText: (await decryptIncoming(msg)) || undefined })));
    return decrypted as Array<MessageOut & { decryptedText?: string }>;
  };

  // Explicit return type to avoid accidental `undefined` widening in consumers
  type Return = {
    isReady: boolean;
    encryptForRecipient: (plaintext: string, recipientId: string) => Promise<any>;
    decryptIncoming: (message: MessageOut) => Promise<string | null>;
    decryptMessages: (messages: MessageOut[]) => Promise<Array<MessageOut & { decryptedText?: string }>>;
    showPassphraseModal: boolean;
    passphraseMode: 'create' | 'restore' | null;
    setShowPassphraseModal: (v: boolean) => void;
    setPassphraseMode: (m: 'create' | 'restore' | null) => void;
    handleCreateBackup: (passphrase: string, remember: boolean) => Promise<void>;
    handleRestore: (passphrase: string, remember?: boolean) => Promise<void>;
    showSyncNotice: boolean;
    dismissSyncNotice: () => void;
    ensureReady: () => Promise<boolean>;
  };

  return {
    isReady,
    encryptForRecipient,
    decryptIncoming,
    decryptMessages,
    showPassphraseModal,
    passphraseMode,
    setShowPassphraseModal: (v: boolean) => setShowPassphraseModal(v as any),
    setPassphraseMode: (m: 'create' | 'restore' | null) => setPassphraseMode(m as any),
    handleCreateBackup,
    handleRestore,
    showSyncNotice,
    dismissSyncNotice: () => setShowSyncNotice(false),
    ensureReady,
  } as Return;
};
