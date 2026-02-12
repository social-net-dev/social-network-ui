/**
 * Room Key Manager - Shared AES keys for E2EE messaging
 *
 * ARCHITECTURE:
 * - Each room has ONE shared AES-256 key
 * - All members use the SAME key to encrypt/decrypt
 * - Key stored in localStorage: e2ee_room_key_{roomId}
 * - Both sender and receiver can decrypt messages
 *
 * WHY THIS APPROACH:
 * ✅ Sender can see their own messages after reload
 * ✅ Receiver can decrypt messages
 * ✅ No plaintext cache needed
 * ✅ Clean localStorage - only keys, no message data
 * ✅ Login/logout doesn't lose access to old messages
 *
 * TRADE-OFFS:
 * ⚠️ Key in localStorage - if user clears it, loses old messages
 * ⚠️ Single-device only (no key sync across devices yet)
 * ⚠️ Room creator generates key - new members need key from backend (future)
 *
 * FUTURE IMPROVEMENTS:
 * - Backend stores encrypted room keys for each member
 * - New members get room key encrypted with their RSA public key
 * - Multi-device: sync room keys via backend
 */

const ROOM_KEY_PREFIX = 'e2ee_room_key_';
const ROOM_KEY_VERSION = 'v1'; // For future key rotation

interface RoomKeyData {
  key: string; // Base64 encoded AES key
  created: number; // Timestamp
  version: string;
}

/**
 * Generate a new AES-256 key for a room
 */
export async function generateRoomKey(): Promise<CryptoKey> {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  console.log('[RoomKey] 🔑 Generated new AES-256 room key');
  return key;
}

/**
 * Export room key to base64 for storage
 */
export async function exportRoomKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import room key from base64
 */
export async function importRoomKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or generate room key
 * - If key exists in localStorage, return it
 * - If not, generate new key and save it
 */
export async function getOrCreateRoomKey(roomId: string): Promise<CryptoKey> {
  const storageKey = `${ROOM_KEY_PREFIX}${roomId}`;

  try {
    // Try to load existing key
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      const data: RoomKeyData = JSON.parse(stored);
      console.log(`[RoomKey] 📂 Loaded existing key for room ${roomId.substring(0, 8)}... (created: ${new Date(data.created).toLocaleString()})`);
      return await importRoomKey(data.key);
    }

    // Generate new key if not exists
    console.log(`[RoomKey] ✨ No key found for room ${roomId.substring(0, 8)}..., generating new one`);
    const newKey = await generateRoomKey();
    const exported = await exportRoomKey(newKey);

    const keyData: RoomKeyData = {
      key: exported,
      created: Date.now(),
      version: ROOM_KEY_VERSION,
    };

    localStorage.setItem(storageKey, JSON.stringify(keyData));
    console.log(`[RoomKey] 💾 Saved new room key to localStorage`);

    return newKey;
  } catch (error) {
    console.error('[RoomKey] ❌ Failed to get/create room key:', error);
    throw error;
  }
}

/**
 * Get room key (without creating if not exists)
 */
export async function getRoomKey(roomId: string): Promise<CryptoKey | null> {
  const storageKey = `${ROOM_KEY_PREFIX}${roomId}`;

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }

    const data: RoomKeyData = JSON.parse(stored);
    return await importRoomKey(data.key);
  } catch (error) {
    console.error('[RoomKey] ❌ Failed to get room key:', error);
    return null;
  }
}

/**
 * Save room key (for when receiving key from backend/other member)
 */
export async function saveRoomKey(roomId: string, key: CryptoKey): Promise<void> {
  const storageKey = `${ROOM_KEY_PREFIX}${roomId}`;

  try {
    const exported = await exportRoomKey(key);
    const keyData: RoomKeyData = {
      key: exported,
      created: Date.now(),
      version: ROOM_KEY_VERSION,
    };

    localStorage.setItem(storageKey, JSON.stringify(keyData));
    console.log(`[RoomKey] 💾 Saved room key for ${roomId.substring(0, 8)}...`);
  } catch (error) {
    console.error('[RoomKey] ❌ Failed to save room key:', error);
    throw error;
  }
}

/**
 * Clear all room keys from localStorage
 */
export function clearAllRoomKeys(): void {
  const keys = Object.keys(localStorage);
  let count = 0;

  keys.forEach(key => {
    if (key.startsWith(ROOM_KEY_PREFIX)) {
      localStorage.removeItem(key);
      count++;
    }
  });

  console.log(`[RoomKey] 🗑️ Cleared ${count} room keys from localStorage`);
}

/**
 * Clear specific room key
 */
export function clearRoomKey(roomId: string): void {
  const storageKey = `${ROOM_KEY_PREFIX}${roomId}`;
  localStorage.removeItem(storageKey);
  console.log(`[RoomKey] 🗑️ Cleared room key for ${roomId.substring(0, 8)}...`);
}

/**
 * List all room IDs that have keys
 */
export function listRoomKeys(): string[] {
  const keys = Object.keys(localStorage);
  return keys.filter(key => key.startsWith(ROOM_KEY_PREFIX)).map(key => key.substring(ROOM_KEY_PREFIX.length));
}

// ============================================
// HELPER FUNCTIONS (same as e2ee.ts)
// ============================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
