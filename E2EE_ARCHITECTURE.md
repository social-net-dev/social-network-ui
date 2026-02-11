# 🔐 E2EE Architecture - Key Persistence Design

## 📋 Tổng Quan

Hệ thống E2EE của chúng ta sử dụng **key persistence architecture** - kiến trúc giống WhatsApp, Signal, Telegram.

**Nguyên tắc cốt lõi:** Private keys gắn với **THIẾT BỊ**, không phải session.

---

## 🏗️ Kiến Trúc

### Storage Pattern

```
localStorage:
  e2ee_private_key_{userId}  → RSA-2048 private key (PKCS#8)
  e2ee_public_key_{userId}   → RSA-2048 public key (SPKI)
```

**Đặc điểm:**

- ✅ Keys **persist** qua login/logout
- ✅ Mỗi user trên mỗi thiết bị có keypair riêng
- ✅ Logout **KHÔNG** xóa keys (by design)
- ⚠️ Clear browser cache → mất keys → mất tin cũ

---

## 🔄 Lifecycle Flow

### 1. First Login on Device

```
User login lần đầu
  ↓
Generate RSA key pair
  ↓
Save to localStorage (e2ee_private_key_{userId})
  ↓
Upload public key to server
  ↓
Ready to send/receive encrypted messages
```

### 2. Subsequent Logins

```
User login lại (same device)
  ↓
Load existing key pair from localStorage
  ↓
Verify public key on server
  ↓
✅ Can decrypt old messages!
```

### 3. Logout

```
User logout
  ↓
Clear auth tokens (access_token, refresh_token)
  ↓
Clear in-memory E2EE state (keyPair object)
  ↓
⚠️ Keys remain in localStorage (by design)
  ↓
User login lại → Load keys → Decrypt old messages ✅
```

### 4. Forget Device (Explicit)

```
User clicks "Đăng xuất khỏi thiết bị này mãi mãi"
  ↓
useE2EEStore.forgetDevice()
  ↓
Delete ALL e2ee_* keys from localStorage
  ↓
❌ Old messages CANNOT be decrypted anymore
```

---

## 🆚 So Sánh Với Các Hệ Thống Khác

### ✅ WhatsApp / Signal

**Device-bound keys:**

- Private key stored on device only
- Encrypted backup to cloud (optional, password-protected)
- Multi-device: Each device has its own key
- Keys synced via encrypted channel

**Our current implementation:** ✅ Same pattern (single device)

---

### ❌ Sai Lầm Phổ Biến (Đã Fix)

**BAD (old code):**

```typescript
logout: async () => {
  clearAllE2EEKeys(); // ❌ SAI!
  // User login lại → generate key mới → KHÔNG đọc được tin cũ
};
```

**CORRECT (new code):**

```typescript
logout: async () => {
  // E2EE keys persist (comment explains why)
  // Only clear auth tokens
};
```

---

## 🔐 Security Considerations

### ✅ Pros

1. **Message Persistence**
   - User keeps access to old messages after re-login
   - No data loss on logout

2. **Industry Standard**
   - Matches WhatsApp/Signal architecture
   - Well-tested design pattern

3. **Offline Capable**
   - Keys available without server connection
   - Fast initialization

### ⚠️ Cons

1. **Browser Cache Dependency**
   - Clear cache → lose keys → lose messages
   - Solution: Implement encrypted cloud backup

2. **Single Device Only**
   - Keys not synced across devices
   - Solution: Implement multi-device protocol

3. **Shared Computer Risk**
   - Anyone with browser access can read messages
   - Mitigation: Use browser profiles / incognito mode

---

## 🚀 Future Enhancements

### 1. Encrypted Cloud Backup (Priority: HIGH)

**Flow:**

```
User sets backup password
  ↓
Derive encryption key from password (PBKDF2)
  ↓
Encrypt private key with derived key
  ↓
Upload to server
  ↓
On new device: Download → Decrypt with password → Restore
```

**Implementation:**

```typescript
export async function backupKeyToServer(privateKey: CryptoKey, password: string, userId: string): Promise<void> {
  // 1. Derive key from password
  const derivedKey = await deriveKeyFromPassword(password);

  // 2. Encrypt private key
  const encryptedPrivateKey = await encryptPrivateKey(privateKey, derivedKey);

  // 3. Upload to server
  await api.post('/api/e2ee/backup', {
    user_id: userId,
    encrypted_private_key: encryptedPrivateKey,
  });
}
```

### 2. Multi-Device Support (Priority: MEDIUM)

**Protocol:**

- Each device has its own key pair
- Server stores public keys for all devices
- When sending message:
  - Encrypt message with AES key
  - Encrypt AES key with EACH recipient device's public key
  - Send multiple `encrypted_key` values

**Implementation considerations:**

- Requires backend changes (store device_id)
- Requires message format changes (array of encrypted_keys)
- Increases message size

### 3. Session Key Rotation (Priority: LOW)

**Current:** Each message = new AES key
**Improvement:** One session key per conversation, rotate periodically

**Benefits:**

- Smaller message size (no encrypted_key per message)
- Forward secrecy (rotate key every N messages)

---

## 🧪 Testing Guide

### Test Case 1: Key Persistence

**Steps:**

1. Login User A → Send message "Hello"
2. Logout
3. Login User A again
4. Navigate to conversation

**Expected:**
✅ Old message "Hello" is decrypted successfully

**Verify:**

```javascript
// Check localStorage
localStorage.getItem('e2ee_private_key_{userId}'); // Must exist
```

---

### Test Case 2: Multi-User Same Device

**Steps:**

1. Login User A → Send message "From A"
2. Logout
3. Login User B → Send message "From B"
4. Logout
5. Login User A again

**Expected:**
✅ User A sees "From A" decrypted
✅ User A sees "From B" encrypted (different keys)
❌ User A CANNOT decrypt "From B" (correct behavior)

**Verify:**

```javascript
// Check localStorage
localStorage.getItem('e2ee_private_key_{userA_id}'); // User A's key
localStorage.getItem('e2ee_private_key_{userB_id}'); // User B's key
// Both keys coexist peacefully
```

---

### Test Case 3: Forget Device

**Steps:**

1. Login User A → Send message "Test"
2. Call `useE2EEStore.getState().forgetDevice()`
3. Reload page → Login User A

**Expected:**
✅ New key pair generated
❌ Old message "Test" shows "[Không thể giải mã tin nhắn]"

**Verify:**

```javascript
// After forgetDevice()
localStorage.getItem('e2ee_private_key_{userId}'); // null
```

---

## 📝 Code References

### Key Functions

1. **Generate/Load Keys:**

```typescript
// src/features/message/lib/e2ee.ts
export async function getOrGenerateKeyPair(userId?: string): Promise<KeyPair>;
```

2. **Persist Keys:**

```typescript
// src/features/message/lib/e2ee.ts
export async function saveKeyPair(keyPair: KeyPair, userId: string): Promise<void>;
export async function loadKeyPair(userId: string): Promise<KeyPair | null>;
```

3. **Clear Keys (Dangerous):**

```typescript
// src/features/message/lib/e2ee.ts
export function clearAllE2EEKeys(): void // ⚠️ Use with caution

// src/stores/e2eeStore.ts
forgetDevice: () => void // Wrapper with warning
```

---

## ⚠️ IMPORTANT: Migration Notes

Nếu user đã sử dụng version cũ (xóa keys khi logout):

- ❌ Tin nhắn cũ đã mất (không thể khôi phục)
- ✅ Tin nhắn mới sẽ dùng architecture mới
- ℹ️ Cần thông báo cho user về thay đổi này

**Migration announcement:**

```
📢 Cập nhật bảo mật E2EE:
- Tin nhắn mã hóa giờ được lưu lâu dài trên thiết bị này
- Bạn có thể đọc lại tin cũ sau khi đăng xuất/đăng nhập
- Tin nhắn KHÔNG đồng bộ qua các thiết bị
- Để xóa hoàn toàn, chọn "Đăng xuất khỏi thiết bị này mãi mãi"
```

---

## 🤝 Contributing

Khi modify E2EE code, cần ensure:

1. ✅ Keys persist across login/logout
2. ✅ No accidental key deletion
3. ✅ Clear comments explaining design decisions
4. ✅ Test với multiple users on same device
5. ✅ Test logout/login flow

**Review checklist:**

- [ ] Keys are never cleared on logout
- [ ] `forgetDevice()` shows confirmation dialog
- [ ] localStorage usage is documented
- [ ] Error handling for missing keys
- [ ] Logs clearly indicate key operations

---

## 📚 References

- [Signal Protocol Specifications](https://signal.org/docs/)
- [WhatsApp Security Whitepaper](https://www.whatsapp.com/security/)
- [Matrix E2EE Implementation](https://matrix.org/docs/guides/end-to-end-encryption-implementation-guide)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**Last Updated:** 2026-02-10
**Architecture Version:** 2.0 (Key Persistence)
