import { create } from 'zustand';
import type { KeyPair } from '@/features/message/lib/e2ee';
import { getOrGenerateKeyPair, exportPublicKey, exportPrivateKey, importPublicKey, clearAllE2EEKeys } from '@/features/message/lib/e2ee';

interface E2EEState {
  keyPair: KeyPair | null;
  publicKeyString: string | null;
  currentUserId: string | null;
  // Store public keys of other users: userId -> publicKeyString
  userPublicKeys: Record<string, string>;
  isInitialized: boolean;

  // Actions
  initialize: (userId: string) => Promise<void>;
  getUserPublicKey: (userId: string) => Promise<CryptoKey | null>;
  setUserPublicKey: (userId: string, publicKey: string) => void;
  clearKeys: () => void;
  forgetDevice: () => void; // Permanently clear all E2EE keys from localStorage
}

export const useE2EEStore = create<E2EEState>((set, get) => ({
  keyPair: null,
  publicKeyString: null,
  currentUserId: null,
  userPublicKeys: {},
  isInitialized: false,

  initialize: async (userId: string) => {
    try {
      console.log(`[E2EE Store] Initializing for user: ${userId}`);

      const keyPair = await getOrGenerateKeyPair(userId);
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      const privateKeyString = await exportPrivateKey(keyPair.privateKey);

      set({
        keyPair,
        publicKeyString,
        currentUserId: userId,
        isInitialized: true,
      });

      console.log(`[E2EE Store] ✅ Initialized for user ${userId}`);
      console.log('[E2EE Store] 🔑 Public key fingerprint:', publicKeyString.substring(0, 40) + '...');
      console.log('[E2EE Store] 🔐 Private key fingerprint:', privateKeyString.substring(0, 40) + '...');
      console.log('[E2EE Store] 📋 Verify localStorage key:', `e2ee_public_key_${userId}`);
    } catch (error) {
      console.error('[E2EE Store] Initialization failed:', error);
      set({ isInitialized: false });
    }
  },

  getUserPublicKey: async (userId: string): Promise<CryptoKey | null> => {
    const state = get();
    const publicKeyString = state.userPublicKeys[userId];

    if (!publicKeyString) {
      console.warn('[E2EE Store] No public key found for user:', userId);
      return null;
    }

    try {
      const publicKey = await importPublicKey(publicKeyString);
      return publicKey;
    } catch (error) {
      console.error('[E2EE Store] Failed to import public key for user:', userId, error);
      return null;
    }
  },

  setUserPublicKey: (userId: string, publicKey: string) => {
    set(state => ({
      userPublicKeys: {
        ...state.userPublicKeys,
        [userId]: publicKey,
      },
    }));
    console.log('[E2EE Store] Stored public key for user:', userId);
  },

  clearKeys: () => {
    const { currentUserId } = get();

    // ⚠️ ONLY clear in-memory state, NOT localStorage!
    // Private keys must persist to decrypt old messages.
    // Use clearAllE2EEKeys() only when user explicitly "forgets device".

    set({
      keyPair: null,
      publicKeyString: null,
      currentUserId: null,
      userPublicKeys: {},
      isInitialized: false,
    });

    console.log('[E2EE Store] ⚠️ Cleared in-memory state (keys still in localStorage):', currentUserId);
  },

  forgetDevice: () => {
    const { currentUserId } = get();

    // ⚠️ DANGER: This permanently deletes ALL E2EE keys from this device
    // User will NOT be able to decrypt old messages after this action
    clearAllE2EEKeys();

    set({
      keyPair: null,
      publicKeyString: null,
      currentUserId: null,
      userPublicKeys: {},
      isInitialized: false,
    });

    console.log('[E2EE Store] 🔥 PERMANENTLY cleared all E2EE keys (old messages will be lost)');
    console.log('[E2EE Store] 🔥 User:', currentUserId);
  },
}));
