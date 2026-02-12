# YÊU CẦU BACKEND CHO E2EE DOUBLE ENCRYPTION MODEL

## 📋 TÓM TẮT

Frontend đã implement **Double Encryption Model** (tương tự Signal/WhatsApp) - mỗi tin nhắn được mã hóa với **2 khóa**:

1. **`encrypted_key_recipient`** - Để người nhận giải mã
2. **`encrypted_key_sender`** - Để người gửi tự giải mã tin của mình sau khi reload page

## 🗄️ DATABASE SCHEMA CHANGES

### Bảng `messages` cần thêm 2 cột mới:

```sql
ALTER TABLE messages
ADD COLUMN encrypted_key_recipient TEXT,
ADD COLUMN encrypted_key_sender TEXT;
```

**Chi tiết các cột:**

| Tên cột                   | Kiểu dữ liệu | Nullable | Mô tả                                                                                                                     |
| ------------------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `encrypted_key_recipient` | `TEXT`       | YES      | AES key đã mã hóa bằng **public key của người NHẬN**. Người nhận dùng cột này để giải mã.                                 |
| `encrypted_key_sender`    | `TEXT`       | YES      | AES key đã mã hóa bằng **public key của người GỬI**. Người gửi dùng cột này để giải mã tin của chính mình sau khi reload. |
| `encrypted_key`           | `TEXT`       | YES      | **Giữ lại để backward compatibility** với tin nhắn cũ. Nếu có thể, map vào `encrypted_key_recipient`.                     |
| `iv`                      | `TEXT`       | YES      | Initialization Vector cho AES-GCM (12 bytes encoded base64).                                                              |
| `ciphertext`              | `TEXT`       | YES      | Nội dung tin nhắn đã mã hóa (base64).                                                                                     |

**Lưu ý:**

- Độ dài string ~350-500 characters (base64-encoded RSA-OAEP encrypted AES-256 key)
- **CẢ 2 cột đều PHẢI được lưu** khi frontend gửi tin nhắn mới
- Không cần decrypt ở backend - backend chỉ lưu trữ và trả về nguyên vẹn

---

## 🔌 API ENDPOINTS CẦN UPDATE

### 1. **POST `/api/rooms/{room_id}/messages`**

#### Request Body Hiện Tại:

```json
{
  "room_id": "string",
  "sender_id": "string",
  "content": "base64_encrypted_ciphertext",
  "client_id": "optional_string",
  "encrypted_key": "base64_string",
  "iv": "base64_string"
}
```

#### Request Body MỚI (cần hỗ trợ):

```json
{
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "user_abc_123",
  "content": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "client_id": "1739449123456-xh3k9s",

  // E2EE Double Encryption Fields
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "iv": "SGVsbG8gV29ybGQ="
}
```

#### Các trường E2EE:

| Field                     | Type     | Required                   | Description                                                                      |
| ------------------------- | -------- | -------------------------- | -------------------------------------------------------------------------------- |
| `encrypted_key_recipient` | `string` | **YES** (nếu E2EE enabled) | AES key encrypted bằng public key của **recipient**. Base64-encoded, ~344 chars. |
| `encrypted_key_sender`    | `string` | **YES** (nếu E2EE enabled) | AES key encrypted bằng public key của **sender**. Base64-encoded, ~344 chars.    |
| `iv`                      | `string` | **YES** (nếu E2EE enabled) | Initialization Vector cho AES-GCM. Base64-encoded 12 bytes = 16 chars.           |
| `content`                 | `string` | YES                        | Nếu E2EE: là `ciphertext` (base64). Nếu không E2EE: là plaintext.                |

#### Response:

```json
{
  "id": "msg_550e8400",
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "user_abc_123",
  "ciphertext": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "iv": "SGVsbG8gV29ybGQ=",
  "created_at": "2026-02-12T10:30:00Z",
  "client_id": "1739449123456-xh3k9s"
}
```

---

### 2. **GET `/api/rooms/{room_id}/messages`**

#### Response Array Item MỚI:

```json
{
  "id": "msg_550e8400",
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "user_abc_123",
  "ciphertext": "eyJhbGciOiJIUzI1NiIsInR5cCI...",

  // E2EE Double Encryption Fields - PHẢI TRẢ VỀ CẢ HAI!
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "iv": "SGVsbG8gV29ybGQ=",

  "created_at": "2026-02-12T10:30:00Z",
  "attachment_url": null,
  "pinned": false,
  "reactions": []
}
```

**Quan trọng:**

- Backend **PHẢI trả về CẢ HAI** fields `encrypted_key_recipient` và `encrypted_key_sender`
- Frontend sẽ tự động chọn field nào để decrypt:
  - Nếu `sender_id == my_user_id` → dùng `encrypted_key_sender`
  - Nếu `sender_id != my_user_id` → dùng `encrypted_key_recipient`

---

### 3. **WebSocket Messages (`action: "message"`)**

#### Frontend → Backend (WebSocket Send):

```json
{
  "action": "message",
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "client_id": "1739449123456-xh3k9s",

  // E2EE Double Encryption Fields
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "iv": "SGVsbG8gV29ybGQ="
}
```

#### Backend → Frontend (WebSocket Broadcast):

```json
{
  "type": "message",
  "id": "msg_550e8400",
  "room_id": "550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "user_abc_123",
  "ciphertext": "eyJhbGciOiJIUzI1NiIsInR5cCI...",

  // E2EE Double Encryption Fields - PHẢI BROADCAST CẢ HAI!
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...",
  "iv": "SGVsbG8gV29ybGQ=",

  "created_at": "2026-02-12T10:30:00Z"
}
```

---

## 🔐 CÁCH HOẠT ĐỘNG (Double Encryption Model)

### Flow gửi tin nhắn:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER A GỬI TIN CHO USER B                                │
└─────────────────────────────────────────────────────────────┘

Frontend User A:
  ├─ Generate random AES-256 key (32 bytes)
  ├─ Encrypt message với AES-GCM: "Hello" → ciphertext + IV
  │
  ├─ RSA-OAEP Encrypt AES key với PUBLIC KEY của User B
  │  └─→ encrypted_key_RECIPIENT
  │
  ├─ RSA-OAEP Encrypt CÙNG AES key với PUBLIC KEY của User A (chính mình!)
  │  └─→ encrypted_key_SENDER
  │
  └─ Send to Backend:
      {
        ciphertext: "...",
        encrypted_key_recipient: "...",  ← Cho User B
        encrypted_key_sender: "...",     ← Cho User A (sau reload)
        iv: "..."
      }

Backend:
  ├─ Lưu vào database:
  │  INSERT INTO messages (
  │    ciphertext,
  │    encrypted_key_recipient,  ← LƯU CỘT NÀY
  │    encrypted_key_sender,      ← LƯU CỘT NÀY
  │    iv,
  │    sender_id,
  │    room_id
  │  )
  │
  └─ Broadcast qua WebSocket cho all members trong room
```

### Flow nhận tin nhắn:

```
┌─────────────────────────────────────────────────────────────┐
│ 2. USER B NHẬN TIN                                           │
└─────────────────────────────────────────────────────────────┘

Frontend User B nhận message từ WebSocket/REST:
  {
    sender_id: "user_a",
    ciphertext: "...",
    encrypted_key_recipient: "...",
    encrypted_key_sender: "...",
    iv: "..."
  }

Frontend User B:
  ├─ Check: sender_id != my_id → Tôi là người NHẬN
  ├─ Chọn: encrypted_key_RECIPIENT
  ├─ RSA-OAEP Decrypt bằng PRIVATE KEY của User B:
  │  encrypted_key_recipient → AES key
  ├─ AES-GCM Decrypt:
  │  ciphertext + AES key + IV → "Hello"
  └─ Hiển thị: "Hello" ✅
```

### Flow người gửi reload page:

```
┌─────────────────────────────────────────────────────────────┐
│ 3. USER A RELOAD PAGE (xem lại tin đã gửi)                  │
└─────────────────────────────────────────────────────────────┘

Frontend User A reload → GET /api/rooms/{room_id}/messages

Backend trả về message:
  {
    sender_id: "user_a",          ← User A là sender
    ciphertext: "...",
    encrypted_key_recipient: "...",
    encrypted_key_sender: "...",  ← Key này dành cho User A!
    iv: "..."
  }

Frontend User A:
  ├─ Check: sender_id == my_id → Tôi là người GỬI
  ├─ Chọn: encrypted_key_SENDER
  ├─ RSA-OAEP Decrypt bằng PRIVATE KEY của User A:
  │  encrypted_key_sender → AES key
  ├─ AES-GCM Decrypt:
  │  ciphertext + AES key + IV → "Hello"
  └─ Hiển thị: "Hello" ✅
```

---

## 📊 EXAMPLE DATA

### Ví dụ 1 tin nhắn E2EE trong database:

```sql
SELECT
  id,
  sender_id,
  room_id,
  ciphertext,
  encrypted_key_recipient,
  encrypted_key_sender,
  iv,
  created_at
FROM messages
WHERE id = 'msg_abc123';
```

Result:

```
id: msg_abc123
sender_id: user_alice_456
room_id: room_xyz_789
ciphertext: j8fK3nV9pL2mQw5xR7tY4uH6gZ1sA0dF... (base64, ~200+ chars)
encrypted_key_recipient: MIIBIjANBgkqhkiG9w0BAQEFAAOC... (base64, ~344 chars)
encrypted_key_sender: MIIBIjANBgkqhkiG9w0BAQEFAAOC... (base64, ~344 chars, KHÁC với recipient)
iv: SGVsbG8gV29ybGQ= (base64, 16 chars)
created_at: 2026-02-12 10:30:00
```

**Lưu ý:**

- `encrypted_key_recipient` và `encrypted_key_sender` có **NỘI DUNG KHÁC NHAU** (vì mã hóa bằng public key khác nhau)
- Nhưng cả hai đều decrypt ra **CÙNG MỘT AES KEY**
- Backend **KHÔNG CẦN** decrypt hoặc validate - chỉ cần lưu trữ nguyên vẹn

---

## ✅ CHECKLIST CHO BACKEND ENGINEER

### Database Migration:

- [ ] Thêm cột `encrypted_key_recipient` (TEXT, nullable) vào bảng `messages`
- [ ] Thêm cột `encrypted_key_sender` (TEXT, nullable) vào bảng `messages`
- [ ] (Optional) Tạo index nếu cần: `CREATE INDEX idx_messages_e2ee ON messages(encrypted_key_recipient, encrypted_key_sender) WHERE encrypted_key_recipient IS NOT NULL;`

### API - POST `/api/rooms/{room_id}/messages`:

- [ ] Accept field `encrypted_key_recipient` trong request body
- [ ] Accept field `encrypted_key_sender` trong request body
- [ ] Accept field `iv` trong request body
- [ ] Lưu CẢ HAI fields vào database khi insert message
- [ ] Return CẢ HAI fields trong response

### API - GET `/api/rooms/{room_id}/messages`:

- [ ] Select CẢ HAI columns từ database:
  ```sql
  SELECT id, sender_id, ciphertext, encrypted_key_recipient,
         encrypted_key_sender, iv, created_at, ...
  FROM messages WHERE room_id = ?
  ```
- [ ] Return CẢ HAI fields trong response array

### WebSocket:

- [ ] Parse `encrypted_key_recipient` và `encrypted_key_sender` từ incoming message
- [ ] Lưu CẢ HAI fields vào database
- [ ] Broadcast CẢ HAI fields đến all members trong room
- [ ] Đảm bảo WebSocket message event có format:
  ```json
  {
    "type": "message",
    "id": "...",
    "sender_id": "...",
    "ciphertext": "...",
    "encrypted_key_recipient": "...",
    "encrypted_key_sender": "...",
    "iv": "...",
    "created_at": "..."
  }
  ```

### Backward Compatibility:

- [ ] Tin nhắn CŨ (chỉ có `encrypted_key`) vẫn hoạt động
- [ ] Nếu frontend chỉ gửi `encrypted_key` (không có `_recipient` suffix), backend có thể:
  - Option A: Lưu vào `encrypted_key_recipient` (recommend)
  - Option B: Lưu vào field `encrypted_key` riêng biệt

### Testing:

- [ ] Test gửi tin nhắn E2EE → kiểm tra database có 2 cột mới
- [ ] Test GET messages → response có đủ 2 fields
- [ ] Test WebSocket broadcast → all clients nhận đủ 2 fields
- [ ] Test tin nhắn cũ (chỉ có `encrypted_key`) vẫn load được

---

## 🚨 QUAN TRỌNG

1. **Backend KHÔNG ĐƯỢC decrypt hoặc validate encrypted keys** - chỉ cần lưu trữ và trả về nguyên vẹn (opaque strings)

2. **CẢ HAI fields đều BẮT BUỘC** khi tin nhắn có E2EE:
   - Thiếu `encrypted_key_recipient` → Người nhận không decrypt được
   - Thiếu `encrypted_key_sender` → Người gửi không xem lại tin của mình sau reload

3. **Độ dài expected:**
   - `encrypted_key_recipient`: ~344 characters (base64 của RSA-OAEP 2048-bit encrypted 32-byte AES key)
   - `encrypted_key_sender`: ~344 characters
   - `iv`: 16 characters (base64 của 12 bytes)
   - `ciphertext`: variable length (depends on plaintext length)

4. **Không cần lưu plaintext:**
   - Backend KHÔNG CẦN lưu `message` (plaintext) field nếu có E2EE
   - Frontend tự decrypt khi cần hiển thị

5. **Security:**
   - Private keys CHỈ tồn tại ở frontend (localStorage của mỗi user)
   - Backend chỉ lưu public keys (có thể lưu trong bảng riêng hoặc user profile)
   - Backend KHÔNG BAO GIỜ nhìn thấy plaintext message

---

## 📞 HỖ TRỢ

Nếu có thắc mắc, liên hệ Frontend Team với:

- Document này: `BACKEND_E2EE_REQUIREMENTS.md`
- Frontend code reference:
  - `src/features/message/lib/e2ee.ts` - Core encryption functions
  - `src/features/message/hooks/useE2EEMessaging.ts` - Hook implementation
  - `src/features/message/types/message.types.ts` - TypeScript types
  - `src/features/message/lib/chatClient.ts` - WebSocket/REST client

**Test Flow Recommended:**

1. User A gửi tin cho User B
2. Check database: message có 2 encrypted keys
3. User B nhận được qua WebSocket → decrypt thành công
4. User A reload page → load messages từ REST API → decrypt tin của mình thành công

Happy Coding! 🚀
