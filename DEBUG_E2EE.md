# 🔐 E2EE Debugging Guide

## ⚠️ CRITICAL: Key Persistence Architecture

**E2EE keys are tied to DEVICE, not session:**

- ✅ Keys **persist** across login/logout (stored in localStorage)
- ✅ User can decrypt old messages after re-login
- ✅ Matches WhatsApp/Signal/Telegram architecture
- ⚠️ Keys are **NOT synced** across devices (each device has its own key pair)
- ⚠️ Logout does **NOT** clear E2EE keys (by design)

**Trade-offs:**

- **Pro:** User keeps access to old messages
- **Pro:** Industry-standard architecture
- **Con:** Keys not synced across devices (requires backend multi-device support)
- **Con:** If browser cache is cleared → old messages lost (solution: encrypted cloud backup)

**How to permanently delete keys:**

```javascript
// Only use when user explicitly "forgets this device"
useE2EEStore.getState().forgetDevice();
```

---

## ✅ Đã Fix Gì?

### 1. **Race Condition trong Init**

- ❌ **Trước**: `useEffect` không đợi `initialize()` complete → `publicKeyString` null → không upload lên server
- ✅ **Sau**: Sử dụng `useE2EEStore.getState()` để lấy public key ngay sau init → đảm bảo upload thành công

### 2. **Retry Mechanism**

- ❌ **Trước**: Không có public key của recipient → gửi plaintext
- ✅ **Sau**: Tự động fetch lại từ server nếu không tìm thấy trong cache

### 3. **Logging Chi Tiết**

- ✅ Mọi bước encrypt/decrypt đều có log với emoji để dễ theo dõi
- ✅ Log chi tiết khi lỗi xảy ra (step nào fail, error message)

---

## 🧪 Cách Test

### Test Case 1: 2 User Khác Nhau Nhắn Tin (Lý tưởng)

**Setup:**

- Browser 1: User A (alice@test.com)
- Browser 2: User B (bob@test.com)

**Steps:**

1. **Browser 1 (A)**:
   - Đăng nhập → Tìm user B → Nhắn tin "Hello from A"
   - Open DevTools → Console → Tìm logs:
     ```
     [E2EE] 🚀 Starting initialization for user: a1b2c3d4...
     [E2EE] ✅ Key pair generated for user: a1b2c3d4...
     [E2EE] ✅ Public key uploaded to server
     [E2EE] 🔐 Attempting to encrypt for recipient: e5f6g7h8...
     [E2EE] 🔄 Public key not in cache, fetching from server...
     [E2EE] ✅ Fetched recipient public key from server
     [E2EE] ✅ Message encrypted successfully
     ```

2. **Browser 2 (B)**:
   - Đăng nhập → Mở conversation với A
   - Kiểm tra console:
     ```
     [E2EE decrypt] 🔐 Attempting to decrypt message
     [E2EE decrypt] Step 1: Decrypting AES key with RSA private key...
     [E2EE decrypt] ✅ Step 1 complete: AES key decrypted
     [E2EE decrypt] Step 2: Importing AES key...
     [E2EE decrypt] ✅ Step 2 complete: AES key imported
     [E2EE decrypt] Step 3: Decrypting message with AES key...
     [E2EE decrypt] ✅ Step 3 complete: Message decrypted
     [E2EE decrypt] ✅ Decryption successful
     ```

3. **Browser 2 (B)**: Reply "Hello from B"
   - Kiểm tra console → Phải thấy encryption logs

4. **Browser 1 (A)**: Nhận tin nhắn từ B
   - Kiểm tra console → Phải thấy decryption logs

**Expected:**
✅ Cả 2 chiều đều encrypt/decrypt thành công
✅ Không có tin nhắn plaintext
✅ Messages hiển thị đúng nội dung

---

### Test Case 2: Timing Issue (User A Init Trước B)

**Scenario:**

- A tạo room mới với B (B chưa login)
- A gửi tin đầu tiên → có thể fail vì chưa có public_key_B

**Expected Behavior:**

1. A gửi tin lần 1:

   ```
   [E2EE] 🔄 Public key not in cache, fetching from server...
   [E2EE] ❌ No public key for recipient: e5f6g7h8... - They may not have initialized E2EE yet
   [ConversationPage] ⚠️ Encryption failed, sending plaintext
   ```

2. B login → Init E2EE → Upload public key

3. A gửi tin lần 2:
   ```
   [E2EE] 🔄 Public key not in cache, fetching from server...
   [E2EE] ✅ Fetched recipient public key from server
   [E2EE] ✅ Message encrypted successfully
   ```

**Fix cho case này:**

- ✅ Retry mechanism đã được thêm vào
- ⚠️ Nếu B chưa login/init E2EE, tin đầu tiên có thể plaintext (acceptable)
- ✅ Tin sau đó sẽ encrypt thành công

---

## 🐛 Debug Decryption Errors

### Lỗi "Không thể giải mã tin nhắn"

**Kiểm tra logs:**

1. **Step 1 fail** → RSA private key sai hoặc message được encrypt cho user khác

   ```
   [E2EE decrypt] Step 1: Decrypting AES key with RSA private key...
   [E2EE decrypt] ❌ Decryption failed at some step
   Error: OperationError
   ```

   **Nguyên nhân:**
   - Sender encrypt bằng wrong public key (không phải của bạn)
   - Bạn đang dùng wrong private key (key của user khác)

   **Cách fix:**
   - Kiểm tra localStorage → `e2ee_private_key_{userId}` phải match với userId hiện tại
   - Logout → Login lại → Clear all E2EE keys → Generate mới

2. **Step 2 fail** → AES key format sai

   ```
   [E2EE decrypt] ✅ Step 1 complete: AES key decrypted
   [E2EE decrypt] Step 2: Importing AES key...
   [E2EE decrypt] ❌ Decryption failed at some step
   ```

   **Nguyên nhân:**
   - Backend lưu sai format `encrypted_key`
   - Base64 encoding issues

3. **Step 3 fail** → IV hoặc ciphertext bị corrupt

   ```
   [E2EE decrypt] ✅ Step 2 complete: AES key imported
   [E2EE decrypt] Step 3: Decrypting message with AES key...
   [E2EE decrypt] ❌ Decryption failed at some step
   ```

   **Nguyên nhân:**
   - Backend lưu sai `iv` hoặc `ciphertext`
   - Network truncate dữ liệu

---

## 🔍 Kiểm Tra Storage

### Mở DevTools → Application → Local Storage

**User A (alice@test.com, userId: a1b2c3d4-...):**

```
e2ee_private_key_a1b2c3d4-...  → RSA private key (JWK format)
e2ee_public_key_a1b2c3d4-...   → RSA public key (JWK format)
```

**User B (bob@test.com, userId: e5f6g7h8-...):**

```
e2ee_private_key_e5f6g7h8-...  → RSA private key (JWK format)
e2ee_public_key_e5f6g7h8-...   → RSA public key (JWK format)
```

**✅ QUAN TRỌNG:**

- Mỗi user PHẢI có key riêng biệt
- Nếu 2 user có cùng key → BUG nghiêm trọng (đã fix ở commit trước)

---

## 📊 Expected Log Flow

### User A gửi tin cho User B:

```
[ConversationPage] 🎯 Fetching recipient for encryption, room: room123
[ConversationPage] 📊 Room members: 2, Current user: a1b2c3d4...
[ConversationPage] ✅ Recipient found: e5f6g7h8..., has_public_key: true

[E2EE] 🚀 Starting initialization for user: a1b2c3d4-...
[E2EE] ✅ Key pair generated for user: a1b2c3d4-...
[E2EE] ✅ Public key uploaded to server for user: a1b2c3d4-...
[E2EE] 🔑 Loaded public key for user: e5f6g7h8...
[E2EE] 📦 Total members: 2, Keys loaded: Yes
[E2EE] ✅ Ready for encrypted messaging

[ConversationPage] 🔐 Attempting E2EE encryption for recipient: e5f6g7h8-...
[E2EE] 🔐 Attempting to encrypt for recipient: e5f6g7h8...
[E2EE] ✅ Message encrypted successfully
[ConversationPage] ✅ Message encrypted successfully
```

### User B nhận và decrypt:

```
[E2EE decrypt] 🔐 Attempting to decrypt message
[E2EE decrypt] 🔓 Starting decryption...
[E2EE decrypt] Step 1: Decrypting AES key with RSA private key...
[E2EE decrypt] ✅ Step 1 complete: AES key decrypted
[E2EE decrypt] Step 2: Importing AES key...
[E2EE decrypt] ✅ Step 2 complete: AES key imported
[E2EE decrypt] Step 3: Decrypting message with AES key...
[E2EE decrypt] ✅ Step 3 complete: Message decrypted
[E2EE decrypt] ✅ Decryption successful, plaintext length: 13
[E2EE decrypt] ✅ Message decrypted successfully
```

---

## ⚠️ Known Limitations (Chấp Nhận Được)

### 1. Tin đầu tiên có thể plaintext nếu:

- User A init trước User B
- User B chưa upload public key

**Solution:** Retry mechanism sẽ kick in cho tin thứ 2 trở đi

### 2. File attachments không encrypt

- Theo yêu cầu ban đầu: "file upload/attachments không cần encryption"

### 3. Group chat chưa support đầy đủ

- Code hiện tại lấy recipient đầu tiên != current user
- Cần refactor để encrypt cho multiple recipients

---

## 🚀 Next Steps (Nếu Cần Optimize)

### Implement Session Key (Recommended)

**Hiện tại:** Mỗi message generate 1 AES key mới
**Chuẩn công nghiệp:** 1 conversation = 1 session key

**Benefits:**

- Nhanh hơn (không phải RSA encrypt mỗi message)
- Ít dữ liệu hơn (không cần gửi `encrypted_key` mỗi tin)
- Forward secrecy (rotate session key định kỳ)

**Trade-offs:**

- Phức tạp hơn để implement
- Cần manage session key lifecycle
- Cần handle key rotation

---

## 📞 Báo Lỗi

Nếu vẫn gặp lỗi, cung cấp:

1. **Console logs** (toàn bộ từ khi init đến khi error)
2. **localStorage screenshot** (keys của cả 2 users)
3. **Network tab** → API call `POST /api/public-keys/` response
4. **Steps to reproduce** (từng bước chi tiết)

---

**✅ Chuẩn bị test ngay bây giờ:**

1. Mở 2 browsers (Chrome + Firefox hoặc Chrome normal + incognito)
2. Login 2 users khác nhau
3. Search → Start chat → Gửi tin
4. Mở DevTools → Console → Đọc logs
5. Verify: Cả 2 chiều đều có 🔐 emoji và "encrypted successfully"
