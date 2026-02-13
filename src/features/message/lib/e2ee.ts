/**
 * End-to-End Encryption Service
 * Using Web Crypto API with RSA-OAEP for key exchange and AES-GCM for message encryption
 */

// ⚠️ E2EE KEY PERSISTENCE ARCHITECTURE ⚠️
//
// CRITICAL DESIGN DECISION:
// - Private keys are stored in localStorage and PERSIST across login/logout
// - Keys are bound to DEVICE (browser), not to session
// - This is REQUIRED to decrypt old messages after re-login
//
// Storage pattern: e2ee_private_key_{userId}
// - Each user has their own key pair on each device
// - Logout does NOT clear these keys (by design)
// - Only cleared when user explicitly "forgets this device"
//
// Trade-offs:
// ✅ User can read old messages after re-login
// ✅ Matches WhatsApp/Signal/Telegram architecture
// ⚠️ If user logs into different account on same browser, keys are separate
// ⚠️ Keys are NOT synced across devices (multi-device support needs backend)
//
// Future improvements:
// - Implement encrypted key backup on server (password-derived encryption)
// - Multi-device key sharing (requires backend support)

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedKeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

/**
 * Get storage keys for specific user
 */
function getStorageKeys(userId: string) {
  return {
    privateKey: `e2ee_private_key_${userId}`,
    publicKey: `e2ee_public_key_${userId}`,
  };
}

/**
 * Clear all E2EE keys from localStorage (for logout)
 */
export function clearAllE2EEKeys(): void {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('e2ee_private_key_') || key.startsWith('e2ee_public_key_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Generate RSA key pair for E2EE
 */
export async function generateKeyPair(): Promise<KeyPair> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );

  return keyPair;
}

/**
 * Export key to base64 string for storage/transmission
 */
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey('pkcs8', key);
  return arrayBufferToBase64(exported);
}

/**
 * Import key from base64 string
 */
export async function importPublicKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

export async function importPrivateKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Encrypt message with AES-GCM (symmetric encryption for actual message)
 * Then encrypt the AES key with recipient's public RSA key
 */
export async function encryptMessage(plaintext: string, recipientPublicKey: CryptoKey): Promise<{ ciphertext: string; encryptedKey: string; iv: string }> {
  // Generate random AES key for this message
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt message with AES
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(plaintext);
  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    aesKey,
    encodedMessage
  );

  // Export AES key
  const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

  // Encrypt AES key with recipient's RSA public key
  const encryptedAesKey = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    exportedAesKey
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedMessage),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt message using private RSA key to decrypt AES key, then decrypt message
 */
export async function decryptMessage(ciphertext: string, encryptedKey: string, iv: string, privateKey: CryptoKey): Promise<string> {
  try {
    // Decrypt AES key using RSA private key
    const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedKey);

    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      privateKey,
      encryptedAesKeyBuffer
    );

    // Import decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt']
    );

    // Decrypt message
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);
    const decryptedMessage = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      aesKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedMessage);

    return plaintext;
  } catch (error) {
    console.error('[E2EE decrypt] ❌ Decryption FAILED!');
    console.error('[E2EE decrypt] Error type:', (error as Error).name);
    console.error('[E2EE decrypt] 🔍 Diagnosis:');
    console.error('  1. This message was encrypted with a DIFFERENT public key');
    console.error('  2. Your private key does NOT match the public key used for encryption');
    console.error('  3. This could be an OLD message (encrypted before clearing localStorage)');
    console.error('  4. Or sender encrypted for WRONG recipient');
    // Silently fail - this is EXPECTED for old messages encrypted with different keys
    throw error;
  }
}

/**
 * Save key pair to localStorage for specific user
 */
export async function saveKeyPair(keyPair: KeyPair, userId: string): Promise<void> {
  const publicKeyStr = await exportPublicKey(keyPair.publicKey);
  const privateKeyStr = await exportPrivateKey(keyPair.privateKey);

  const storageKeys = getStorageKeys(userId);
  localStorage.setItem(storageKeys.publicKey, publicKeyStr);
  localStorage.setItem(storageKeys.privateKey, privateKeyStr);
}

/**
 * Load key pair from localStorage for specific user
 */
export async function loadKeyPair(userId: string): Promise<KeyPair | null> {
  const storageKeys = getStorageKeys(userId);
  const publicKeyStr = localStorage.getItem(storageKeys.publicKey);
  const privateKeyStr = localStorage.getItem(storageKeys.privateKey);

  if (!publicKeyStr || !privateKeyStr) {
    return null;
  }

  try {
    const publicKey = await importPublicKey(publicKeyStr);
    const privateKey = await importPrivateKey(privateKeyStr);
    return { publicKey, privateKey };
  } catch (error) {
    console.error('[E2EE loadKeyPair] ❌ Failed to import keys:', error);
    return null;
  }
}

/**
 * Get or generate key pair for specific user
 */
export async function getOrGenerateKeyPair(userId?: string): Promise<KeyPair> {
  if (!userId) {
    return await generateKeyPair();
  }

  let keyPair = await loadKeyPair(userId);

  if (!keyPair) {
    keyPair = await generateKeyPair();
    await saveKeyPair(keyPair, userId);
  }

  return keyPair;
}

/**
 * Clear stored keys for specific user (logout)
 */
export function clearKeys(userId: string): void {
  const storageKeys = getStorageKeys(userId);
  localStorage.removeItem(storageKeys.publicKey);
  localStorage.removeItem(storageKeys.privateKey);
}

/**
 * Helper: Convert ArrayBuffer to Base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
