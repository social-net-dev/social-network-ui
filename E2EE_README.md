# 🔐 End-to-End Encryption (E2EE) Feature

## Tổng quan

Hệ thống nhắn tin hiện đã được tích hợp mã hóa đầu cuối (E2EE) sử dụng chuẩn crypto mạnh mẽ:

- **RSA-OAEP 2048-bit** cho việc trao đổi khóa
- **AES-GCM 256-bit** cho mã hóa nội dung tin nhắn

## 🏗️ Kiến trúc

### 1. Key Management

Mỗi user có một cặp khóa RSA:

- **Private Key**: Được lưu an toàn trong `localStorage`, không bao giờ rời khỏi thiết bị
- **Public Key**: Được gửi lên server để chia sẻ với các user khác

**Lưu trữ keys:**

```typescript
localStorage.setItem('e2ee_private_key', privateKeyBase64);
localStorage.setItem('e2ee_public_key', publicKeyBase64);
```

### 2. Quy trình mã hóa

#### Khi gửi tin nhắn:

1. **Generate AES Key**: Tạo khóa AES-GCM ngẫu nhiên cho tin nhắn này
2. **Encrypt Message**: Mã hóa nội dung tin nhắn với AES-GCM
3. **Encrypt AES Key**: Mã hóa khóa AES với RSA public key của người nhận
4. **Send**: Gửi lên server:
   - `ciphertext`: Tin nhắn đã mã hóa (AES)
   - `encrypted_key`: Khóa AES đã mã hóa (RSA)
   - `iv`: Initialization Vector cho AES-GCM

#### Khi nhận tin nhắn:

1. **Decrypt AES Key**: Giải mã khóa AES bằng RSA private key của mình
2. **Decrypt Message**: Giải mã nội dung tin nhắn bằng khóa AES vừa giải mã được
3. **Display**: Hiển thị tin nhắn đã giải mã

### 3. Components & Hooks

#### `e2ee.ts` - Core encryption service

```typescript
// Generate key pair
const keyPair = await generateKeyPair();

// Encrypt message
const encrypted = await encryptMessage(plaintext, recipientPublicKey);
// Returns: { ciphertext, encryptedKey, iv }

// Decrypt message
const plaintext = await decryptMessage(ciphertext, encryptedKey, iv, privateKey);
```

#### `e2eeStore.ts` - Global state management

```typescript
const {
  keyPair, // Current user's key pair
  publicKeyString, // Public key (base64)
  userPublicKeys, // Other users' public keys
  initialize, // Init E2EE
  getUserPublicKey, // Get public key của user khác
  setUserPublicKey, // Store public key của user khác
} = useE2EEStore();
```

#### `useE2EEMessaging.ts` - Hook for messaging flow

```typescript
const {
  isReady, // E2EE ready?
  encryptForRecipient, // Mã hóa cho recipient
  decryptIncoming, // Giải mã tin nhắn nhận được
  decryptMessages, // Giải mã nhiều tin nhắn
} = useE2EEMessaging({ roomId, userId, enabled: true });
```

## 🔧 Cách sử dụng

### Backend Requirements

Backend cần implement các endpoints sau:

#### 1. Upload Public Key

```python
@router.post('/users/public_key')
async def set_public_key(payload: PublicKeyRequest):
    # Lưu public key của user vào database
    # Trả về: { user_id, public_key }
```

#### 2. Get User's Public Key

```python
@router.get('/users/{user_id}/public_key')
async def get_user_public_key(user_id: str):
    # Trả về public key của user
    # Returns: { user_id, public_key }
```

#### 3. Get Room Members' Public Keys

```python
@router.get('/rooms/{room_id}/members/public_keys')
async def get_room_member_public_keys(room_id: str):
    # Trả về public keys của tất cả members trong room
    # Returns: { members: [{ user_id, public_key }, ...] }
```

#### 4. Store Encrypted Message

```python
@router.post('/rooms/{room_id}/messages')
async def post_message(room_id: str, payload: MessageRequest):
    # Payload có thể chứa:
    # - content: ciphertext (base64)
    # - encrypted_key: encrypted AES key (base64)
    # - iv: initialization vector (base64)
```

### Frontend Integration

E2EE được tự động kích hoạt khi:

1. User vào trang messages
2. `useE2EEMessaging` hook được khởi tạo
3. Key pair được generate/load từ localStorage
4. Public key được upload lên server
5. Public keys của members trong room được tải về

**Tin nhắn sẽ tự động được:**

- ✅ Mã hóa khi gửi
- ✅ Giải mã khi nhận
- ✅ Hiển thị plaintext cho user

## 📝 Database Schema

Backend cần thêm cột để lưu E2EE data:

```sql
-- User table
ALTER TABLE users ADD COLUMN public_key TEXT;

-- Message table
ALTER TABLE messages ADD COLUMN encrypted_key TEXT;
ALTER TABLE messages ADD COLUMN iv TEXT;
-- Cột ciphertext đã có sẵn
```

## 🔒 Bảo mật

### ✅ Điểm mạnh:

- **Private key không rời khỏi thiết bị** - Stored locally only
- **RSA-OAEP 2048-bit** - Industry standard
- **AES-GCM 256-bit** - Authenticated encryption
- **Unique IV per message** - Prevents replay attacks
- **Web Crypto API** - Native browser implementation

### ⚠️ Giới hạn & Cân nhắc:

1. **Key Recovery**: Nếu user mất thiết bị → mất private key → không đọc được tin nhắn cũ
   - **Giải pháp**: Implement key backup/recovery mechanism
2. **Group Chat**: Hiện tại encrypt cho 1 recipient
   - **Cải thiện**: Encrypt cho tất cả members trong group
3. **Forward Secrecy**: Không hỗ trợ perfect forward secrecy
   - **Cải thiện**: Implement Double Ratchet Algorithm (như Signal Protocol)

4. **Key Rotation**: Keys không tự động rotate
   - **Cải thiện**: Implement periodic key rotation

## 🚀 Roadmap

- [ ] Multi-recipient encryption cho group chat
- [ ] Key backup & recovery mechanism
- [ ] Key rotation policy
- [ ] Double Ratchet Algorithm (Signal Protocol)
- [ ] Verify contact's public key (key fingerprint)
- [ ] Self-destructing messages
- [ ] Read receipts với E2EE

## 🧪 Testing

### Test E2EE locally:

```bash
# Start dev server
pnpm dev

# Open 2 browser windows (different users)
# Gửi tin nhắn từ user A → user B
# Check console logs để xem encryption/decryption flow
```

### Debug logs:

- `[E2EE] Generating new key pair...` - Key generation
- `[E2EE] Public key uploaded to server` - Key sync
- `[E2EE] Loaded X member public keys` - Member keys loaded
- `[ConversationPage] Message encrypted successfully` - Encryption success
- `[E2EE] Decryption failed` - Decryption error

## 📚 References

- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [RSA-OAEP Specification](https://tools.ietf.org/html/rfc3447)
- [AES-GCM Mode](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [Signal Protocol](https://signal.org/docs/)
