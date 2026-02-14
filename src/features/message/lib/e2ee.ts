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
      console.log('[E2EE] Cleared key:', key);
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
 * Derive an AES-GCM CryptoKey from a passphrase using PBKDF2
 */
async function deriveKeyFromPassphrase(passphrase: string, salt: BufferSource, iterations = 150000): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passKey = await window.crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

/**
 * Encrypt exported private key string with passphrase (PBKDF2 + AES-GCM)
 * Returns ciphertext and metadata for server storage
 */
export async function encryptPrivateKeyWithPassphrase(exportedPrivateKeyBase64: string, passphrase: string) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 150000;

  const aesKey = await deriveKeyFromPassphrase(passphrase, salt, iterations);

  const dataBuffer = base64ToArrayBuffer(exportedPrivateKeyBase64);

  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, dataBuffer);

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    salt: arrayBufferToBase64(salt.buffer),
    iv: arrayBufferToBase64(iv.buffer),
    iterations,
    algo: 'PBKDF2+AES-GCM',
    version: 'v1',
  };
}

/**
 * Decrypt ciphertext (from server) using passphrase
 */
export async function decryptPrivateKeyWithPassphrase(payload: { ciphertext: string; salt: string; iv: string; iterations: number; algo: string }, passphrase: string) {
  if (!payload || typeof payload !== 'object') {
    console.error('[E2EE] decryptPrivateKeyWithPassphrase: payload is invalid', payload);
    throw new Error('Invalid backup payload');
  }

  // Support server responses that wrap backup inside `backups: [{...}]`
  let record: any = payload as any;
  if (Array.isArray((payload as any).backups) && (payload as any).backups.length > 0) {
    record = (payload as any).backups[0];
    console.log('[E2EE] decryptPrivateKeyWithPassphrase: using backups[0] record');
  }

  const missing: string[] = [];
  if (!record.salt) missing.push('salt');
  if (!record.iv) missing.push('iv');
  if (!record.ciphertext) missing.push('ciphertext');
  if (missing.length) {
    console.error('[E2EE] decryptPrivateKeyWithPassphrase: missing fields in payload', record);
    throw new Error(`Backup payload missing fields: ${missing.join(', ')}`);
  }

  let saltBuf: ArrayBuffer;
  let ivBuf: ArrayBuffer;
  let ciphertextBuf: ArrayBuffer;
  try {
    saltBuf = base64ToArrayBuffer(record.salt);
    ivBuf = base64ToArrayBuffer(record.iv);
    ciphertextBuf = base64ToArrayBuffer(record.ciphertext);
  } catch (err) {
    console.error('[E2EE] Failed to base64-decode backup payload fields', err, record);
    throw new Error('Failed to decode backup payload (invalid base64)');
  }

  const salt = new Uint8Array(saltBuf);
  const iv = new Uint8Array(ivBuf);

  const iterations = (record.iterations as number) || payload.iterations || 150000;
  const aesKey = await deriveKeyFromPassphrase(passphrase, salt, iterations);

  const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, ciphertextBuf);
  return arrayBufferToBase64(decrypted);
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
  // Debug: Export recipient public key to verify
  const recipientPublicKeyExported = await exportPublicKey(recipientPublicKey);
  const recipientKeyFingerprint = recipientPublicKeyExported.substring(0, 60);

  console.log('🔐 ==================== ENCRYPTION START ====================');
  console.log('[E2EE encrypt] 🔑 Recipient Public Key Fingerprint:', recipientKeyFingerprint);
  console.log('[E2EE encrypt] 📝 Plaintext length:', plaintext.length);
  console.log('============================================================');

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

  console.log('[E2EE encrypt] ✅ Encryption complete:', {
    ciphertext_length: arrayBufferToBase64(encryptedMessage).length,
    encryptedKey_length: arrayBufferToBase64(encryptedAesKey).length,
    iv_length: arrayBufferToBase64(iv.buffer).length,
  });
  console.log('🔐 ==================== ENCRYPTION END ======================\n');

  return {
    ciphertext: arrayBufferToBase64(encryptedMessage),
    encryptedKey: arrayBufferToBase64(encryptedAesKey),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * DOUBLE ENCRYPTION - Encrypt cho CẢ RECIPIENT VÀ SENDER
 *
 * Như vậy:
 * - Recipient decrypt bằng private key của họ
 * - Sender decrypt bằng private key của mình (sau reload)
 * - Không cần cache plaintext
 * - Không cần backend lưu plaintext
 *
 * @returns {
 *   ciphertext: string,
 *   encrypted_key_recipient: string,  // AES key encrypted cho recipient
 *   encrypted_key_sender: string,     // AES key encrypted cho sender
 *   iv: string
 * }
 */
export async function encryptMessageForBoth(
  plaintext: string,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<{
  ciphertext: string;
  encrypted_key_recipient: string;
  encrypted_key_sender: string;
  iv: string;
}> {
  console.log('🔐 ==================== DOUBLE ENCRYPTION START ====================');
  console.log('[E2EE] Encrypting for BOTH recipient and sender');

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

  // Encrypt AES key cho RECIPIENT
  const encryptedAesKeyForRecipient = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    exportedAesKey
  );

  // Encrypt AES key cho SENDER (chính mình)
  const encryptedAesKeyForSender = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    senderPublicKey,
    exportedAesKey
  );

  const result = {
    ciphertext: arrayBufferToBase64(encryptedMessage),
    encrypted_key_recipient: arrayBufferToBase64(encryptedAesKeyForRecipient),
    encrypted_key_sender: arrayBufferToBase64(encryptedAesKeyForSender),
    iv: arrayBufferToBase64(iv.buffer),
  };

  console.log('[E2EE] ✅ Double encryption complete:', {
    ciphertext_length: result.ciphertext.length,
    key_for_recipient_length: result.encrypted_key_recipient.length,
    key_for_sender_length: result.encrypted_key_sender.length,
    iv_length: result.iv.length,
  });
  console.log('🔐 ==================== DOUBLE ENCRYPTION END ======================\n');

  return result;
}

/**
 * Decrypt message using private RSA key to decrypt AES key, then decrypt message
 */
export async function decryptMessage(ciphertext: string, encryptedKey: string, iv: string, privateKey: CryptoKey): Promise<string> {
  // Export private key fingerprint for debugging
  const privateKeyExported = await exportPrivateKey(privateKey);
  const privateKeyFingerprint = privateKeyExported.substring(0, 60);

  console.log('🔓 ==================== DECRYPTION START ====================');
  console.log('[E2EE decrypt] 🔑 My Private Key Fingerprint:', privateKeyFingerprint);
  console.log('[E2EE decrypt] 📦 Input lengths:', {
    ciphertext: ciphertext.length,
    encryptedKey: encryptedKey.length,
    iv: iv.length,
  });
  console.log('============================================================');

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

    console.log('[E2EE decrypt] ✅ Decryption successful');
    console.log('[E2EE decrypt] 📝 Plaintext length:', plaintext.length);
    console.log('🔓 ==================== DECRYPTION END ======================\n');

    return plaintext;
  } catch (error) {
    console.error('[E2EE decrypt] ❌ Decryption FAILED!');
    console.error('[E2EE decrypt] Error type:', (error as Error).name);
    console.error('[E2EE decrypt] 🔍 Diagnosis:');
    console.error('  1. This message was encrypted with a DIFFERENT public key');
    console.error('  2. Your private key does NOT match the public key used for encryption');
    console.error('  3. This could be an OLD message (encrypted before clearing localStorage)');
    console.error('  4. Or sender encrypted for WRONG recipient');
    console.log('🔓 ==================== DECRYPTION END ======================\n');
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

  console.log(`[E2EE saveKeyPair] 💾 Saving keys for user: ${userId}`);
  console.log(`[E2EE saveKeyPair] 🔑 Public key length: ${publicKeyStr.length}`);
  console.log(`[E2EE saveKeyPair] 🔐 Private key length: ${privateKeyStr.length}`);
  console.log(`[E2EE saveKeyPair] 📦 Storage key: ${storageKeys.publicKey}`);

  localStorage.setItem(storageKeys.publicKey, publicKeyStr);
  localStorage.setItem(storageKeys.privateKey, privateKeyStr);

  // VERIFY immediately after saving
  const verifyPublic = localStorage.getItem(storageKeys.publicKey);
  const verifyPrivate = localStorage.getItem(storageKeys.privateKey);
  console.log(`[E2EE saveKeyPair] ✅ VERIFY: Public key saved: ${!!verifyPublic} (length: ${verifyPublic?.length})`);
  console.log(`[E2EE saveKeyPair] ✅ VERIFY: Private key saved: ${!!verifyPrivate} (length: ${verifyPrivate?.length})`);
  console.log(`[E2EE saveKeyPair] 📊 Total localStorage items: ${localStorage.length}`);
}

/**
 * Load key pair from localStorage for specific user
 */
export async function loadKeyPair(userId: string): Promise<KeyPair | null> {
  const storageKeys = getStorageKeys(userId);

  console.log(`\n🔍 [E2EE loadKeyPair] ==================== LOAD START ====================`);
  console.log(`[E2EE loadKeyPair] 👤 User: ${userId.substring(0, 8)}...`);
  console.log(`[E2EE loadKeyPair] 📦 Looking for key: ${storageKeys.publicKey}`);
  console.log(`[E2EE loadKeyPair] 📊 Total localStorage items: ${localStorage.length}`);
  console.log(`[E2EE loadKeyPair] 🗂️ All localStorage keys:`, Object.keys(localStorage));

  const publicKeyStr = localStorage.getItem(storageKeys.publicKey);
  const privateKeyStr = localStorage.getItem(storageKeys.privateKey);

  console.log('[E2EE loadKeyPair] 🔑 Public key exists:', !!publicKeyStr, `(length: ${publicKeyStr?.length})`);
  console.log('[E2EE loadKeyPair] 🔐 Private key exists:', !!privateKeyStr, `(length: ${privateKeyStr?.length})`);

  if (!publicKeyStr || !privateKeyStr) {
    console.warn('[E2EE loadKeyPair] ❌ Keys NOT FOUND in localStorage!');
    console.warn('[E2EE loadKeyPair] 📊 This means localStorage was cleared or keys were never saved');
    console.warn(`[E2EE loadKeyPair] 🔍 Expected key: ${storageKeys.publicKey}`);
    console.log(`[E2EE loadKeyPair] ==================== LOAD END (FAILED) ====================\n`);
    return null;
  }

  try {
    const publicKey = await importPublicKey(publicKeyStr);
    const privateKey = await importPrivateKey(privateKeyStr);
    console.log(`[E2EE loadKeyPair] ✅ Keys loaded successfully for user: ${userId.substring(0, 8)}...`);
    console.log('[E2EE loadKeyPair] 🔑 Public key fingerprint:', publicKeyStr.substring(0, 40) + '...');
    console.log(`[E2EE loadKeyPair] ==================== LOAD END (SUCCESS) ====================\n`);
    return { publicKey, privateKey };
  } catch (error) {
    console.error('[E2EE loadKeyPair] ❌ Failed to import keys:', error);
    console.log(`[E2EE loadKeyPair] ==================== LOAD END (ERROR) ====================\n`);
    return null;
  }
}

/**
 * Get or generate key pair for specific user
 */
export async function getOrGenerateKeyPair(userId?: string): Promise<KeyPair> {
  console.log(`\n🔐 [E2EE getOrGenerateKeyPair] ======== START ========`);
  console.log(`[E2EE getOrGenerateKeyPair] 👤 userId provided: ${!!userId} (${userId?.substring(0, 8)}...)`);

  if (!userId) {
    console.warn('[E2EE getOrGenerateKeyPair] ❌ No userId provided, generating temporary keys');
    console.log(`[E2EE getOrGenerateKeyPair] ======== END (TEMP) ========\n`);
    return await generateKeyPair();
  }

  console.log(`[E2EE getOrGenerateKeyPair] 📥 Attempting to load existing keys...`);
  let keyPair = await loadKeyPair(userId);

  if (!keyPair) {
    console.log(`[E2EE getOrGenerateKeyPair] ⚠️ No existing keys found, generating NEW key pair...`);
    keyPair = await generateKeyPair();
    console.log(`[E2EE getOrGenerateKeyPair] 💾 Saving new key pair to localStorage...`);
    await saveKeyPair(keyPair, userId);
    console.log(`[E2EE getOrGenerateKeyPair] ✅ New key pair generated and saved for user: ${userId}`);
  } else {
    console.log(`[E2EE getOrGenerateKeyPair] ✅ Existing keys LOADED from localStorage`);
  }

  console.log(`[E2EE getOrGenerateKeyPair] ======== END ========\n`);
  return keyPair;
}

/**
 * Clear stored keys for specific user (logout)
 */
export function clearKeys(userId: string): void {
  const storageKeys = getStorageKeys(userId);
  localStorage.removeItem(storageKeys.publicKey);
  localStorage.removeItem(storageKeys.privateKey);
  console.log(`[E2EE] Keys cleared for user: ${userId}`);
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
  // Normalize base64: remove whitespace, convert URL-safe chars, and add padding if needed
  let src = base64.replace(/\s+/g, '');
  src = src.replace(/-/g, '+').replace(/_/g, '/');
  const pad = src.length % 4;
  if (pad === 2) src += '==';
  else if (pad === 3) src += '=';

  try {
    const binary = atob(src);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (err) {
    console.error('[E2EE] base64ToArrayBuffer failed to decode input:', base64);
    throw err;
  }
}

// ============================================
// SHARED ROOM KEY ENCRYPTION (NEW - V2)
// ============================================

/**
 * Encrypt message with shared room key (AES-GCM)
 *
 * This is the NEW recommended approach for room-based messaging:
 * - All members share the same room key
 * - Both sender and receiver can decrypt
 * - No need to cache plaintext
 * - Simpler than RSA key exchange
 *
 * @param plaintext - Message to encrypt
 * @param roomKey - Shared AES key for the room
 * @returns Object with ciphertext and iv (no encrypted_key needed)
 */
export async function encryptWithRoomKey(plaintext: string, roomKey: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  console.log('🔐 [Room E2EE] Encrypting with shared room key...');

  // Generate random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Encrypt message with room's AES key
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(plaintext);

  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    roomKey,
    encodedMessage
  );

  const result = {
    ciphertext: arrayBufferToBase64(encryptedMessage),
    iv: arrayBufferToBase64(iv.buffer),
  };

  console.log('✅ [Room E2EE] Encryption complete:', {
    plaintext_length: plaintext.length,
    ciphertext_length: result.ciphertext.length,
    iv_length: result.iv.length,
  });

  return result;
}

/**
 * Decrypt message with shared room key (AES-GCM)
 *
 * @param ciphertext - Encrypted message (base64)
 * @param iv - Initialization vector (base64)
 * @param roomKey - Shared AES key for the room
 * @returns Decrypted plaintext
 */
export async function decryptWithRoomKey(ciphertext: string, iv: string, roomKey: CryptoKey): Promise<string> {
  console.log('🔓 [Room E2EE] Decrypting with shared room key...', {
    ciphertext_length: ciphertext.length,
    iv_length: iv.length,
  });

  try {
    // Convert from base64
    const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
    const ivBuffer = base64ToArrayBuffer(iv);

    // Decrypt with room key
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      roomKey,
      ciphertextBuffer
    );

    // Decode to string
    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);

    console.log('✅ [Room E2EE] Decryption successful, plaintext length:', plaintext.length);
    return plaintext;
  } catch (error) {
    console.error('❌ [Room E2EE] Decryption failed:', error);
    throw new Error('Failed to decrypt message with room key');
  }
}
