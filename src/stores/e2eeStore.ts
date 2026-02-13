import { create } from 'zustand';
import type { KeyPair } from '@/features/message/lib/e2ee';
import { getOrGenerateKeyPair, exportPublicKey, importPublicKey, clearAllE2EEKeys } from '@/features/message/lib/e2ee';

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
      const keyPair = await getOrGenerateKeyPair(userId);
      const publicKeyString = await exportPublicKey(keyPair.publicKey);

      set({
        keyPair,
        publicKeyString,
        currentUserId: userId,
        isInitialized: true,
      });
    } catch (error) {
      console.error('[E2EE Store] Initialization failed:', error);
      set({ isInitialized: false });
    }
  },

  getUserPublicKey: async (userId: string): Promise<CryptoKey | null> => {
    const state = get();
    const publicKeyString = state.userPublicKeys[userId];

    if (!publicKeyString) {
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
  },

  clearKeys: () => {
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
  },

  forgetDevice: () => {
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
  },
}));