# E2EE Troubleshooting Guide - Message Cache System

## 🎯 Vấn đề đã giải quyết

### Vấn đề 1: Người nhận load lại không giải mã được tin nhắn

**Nguyên nhân:** Backend API REST không trả về `encrypted_key` và `iv`

**Cách kiểm tra:**

1. Mở Console (F12)
2. Reload page
3. Tìm log: `🔍 [useMessageManager] RAW API RESPONSE`
4. Kiểm tra:
   ```javascript
   {
     first_message_sample: {
       has_encrypted_key: false,  // ❌ NẾU FALSE = BACKEND LỖI!
       has_iv: false,              // ❌ NẾU FALSE = BACKEND LỖI!
     }
   }
   ```

**Giải pháp:** Backend cần fix endpoint `GET /api/rooms/{room_id}/messages` để trả về đầy đủ:

```json
{
  "id": "...",
  "ciphertext": "...",
  "encrypted_key": "...", // ⚠️ BẮT BUỘC
  "iv": "..." // ⚠️ BẮT BUỘC
}
```

---

### Vấn đề 2: Người gửi load lại không thấy tin nhắn của mình

**Nguyên nhân:**

- Người gửi mã hóa tin nhắn bằng PUBLIC KEY của người nhận
- Người gửi không thể decrypt (không có private key của người nhận)
- Sau reload, mất `_plaintext` từ memory

**Giải pháp đã implement:** Message Cache System (localStorage)

**Flow hoàn chỉnh:**

1. **Khi gửi tin:**
   - Lưu plaintext vào memory (`_plaintext` field)
   - Lưu plaintext vào localStorage với `client_id`
   - Log: `💾 Cached plaintext for sent message`

2. **Khi nhận ACK từ server:**
   - Lưu thêm plaintext vào localStorage với `server_id`
   - Log: `💾 Cached plaintext with server ID`

3. **Khi hiển thị tin nhắn:**
   - Ưu tiên: `_plaintext` (memory) → localStorage cache → backend `message` field
   - Log: `📖 Retrieved plaintext from cache`

4. **Auto cleanup:**
   - Xóa cache cũ hơn 30 ngày
   - Chạy mỗi khi init E2EE
   - Log: `🧹 Cleaned X old messages`

---

## 📊 Debug Logs - Ý nghĩa

### Khi gửi tin nhắn:

```
[ChatClient] 📤 Sending via WS: {
  has_encrypted_key: true,     // ✅ Frontend đã mã hóa đúng
  has_iv: true,
  encrypted_key_length: 344,
  iv_length: 16
}

[useChat] 💾 Cached plaintext for sent message: abc12345...
[useChat] 💾 Cached plaintext with server ID: xyz98765...
```

### Khi load tin nhắn từ API:

```
🔍 [useMessageManager] RAW API RESPONSE: {
  total_messages: 5,
  first_message_sample: {
    has_encrypted_key: true,   // ✅ Backend đã lưu đúng
    has_iv: true,
    encrypted_key_length: 344,
    iv_length: 16
  }
}

📦 [useMessageManager] MAPPED MESSAGES: {
  with_e2ee: 3,                // Số tin có E2EE fields
  without_e2ee: 2              // Số tin không có (plaintext hoặc lỗi)
}
```

### Khi decrypt tin nhắn:

```
// Tin của người khác (nhận được):
🔓 ==================== DECRYPT INCOMING ====================
[E2EE decrypt] ✅✅✅ SUCCESS - Message decrypted!

// Tin của mình (đã gửi):
📤 [E2EE] Using in-memory plaintext for my own message
// Hoặc sau reload:
💾 [E2EE] Retrieved plaintext from cache for my own message
```

---

## ⚠️ Lỗi thường gặp

### 1. Backend không trả về E2EE fields

```
[E2EE] ⚠️ Message missing E2EE fields: {
  has_encrypted_key: false,
  has_iv: false,
  message_id: '...'
}
```

**→ Check backend:** Database có lưu `encrypted_key` và `iv` không? API có select 2 fields này không?

### 2. WebSocket không broadcast E2EE fields

```
📨 [ChatClient] RAW WebSocket Message: {
  type: 'message',
  has_encrypted_key: false,  // ❌ Backend chỉ broadcast ciphertext!
  has_iv: false
}
```

**→ Check backend WebSocket handler:** Khi broadcast message, phải gửi đầy đủ `encrypted_key` và `iv`

### 3. Người gửi không thấy tin của mình sau reload

```
📤 [E2EE] Cannot decrypt my own message (encrypted for recipient, no cache)
```

**→ Normal behavior** nếu:

- Tin nhắn cũ (trước khi có cache system)
- Cache đã bị xóa (clear localStorage)
- Đăng nhập từ thiết bị khác

**→ Tin nhắn MỚI (sau patch này) sẽ được cache và hiển thị đúng!**

---

## 🧪 Cách test

1. **Gửi tin nhắn mã hóa mới**
2. **Kiểm tra logs:**
   - ✅ `💾 Cached plaintext` xuất hiện
   - ✅ Người gửi thấy plaintext ngay lập tức
   - ✅ Người nhận giải mã thành công

3. **Reload page của người GỬI**
4. **Kiểm tra logs:**
   - ✅ `🔍 [useMessageManager] RAW API RESPONSE` - check `has_encrypted_key`, `has_iv`
   - ✅ `💾 [E2EE] Retrieved plaintext from cache` - tin của mình hiển thị từ cache
   - ✅ Tin nhắn hiển thị chính xác

5. **Reload page của người NHẬN**
6. **Kiểm tra logs:**
   - ✅ `🔍 [useMessageManager] RAW API RESPONSE` - check backend có trả về E2EE fields
   - ✅ `🔓 [E2EE decrypt] ✅✅✅ SUCCESS` - giải mã thành công
   - ✅ Tin nhắn hiển thị chính xác

---

## 🔒 Cache Security Notes

- **Storage location:** localStorage (per domain)
- **Key format:** `msg_plaintext_{messageId}_{userId}`
- **Auto cleanup:** Messages older than 30 days
- **Logout behavior:** Cache KHÔNG bị xóa (giống E2EE keys)
- **Multi-device:** Cache riêng biệt trên mỗi device
- **Risk:** Nếu ai đó truy cập localStorage trên device → có thể đọc plaintext của tin đã gửi (không đọc được tin nhận)

---

## 🚀 Next Steps - BACKEND CẦN FIX

### 1. Database Schema

Đảm bảo table `messages` có cột:

```sql
ALTER TABLE messages ADD COLUMN encrypted_key TEXT;
ALTER TABLE messages ADD COLUMN iv TEXT;
```

### 2. WebSocket Handler

Khi lưu và broadcast message:

```python
message = {
    "type": "message",
    "id": message_id,
    "ciphertext": ciphertext,
    "encrypted_key": encrypted_key,  # ⚠️ BẮT BUỘC BROADCAST
    "iv": iv,                         # ⚠️ BẮT BUỘC BROADCAST
    "sender_id": sender_id,
    "room_id": room_id
}
await websocket_manager.broadcast(room_id, message)
```

### 3. REST API - POST Message

Endpoint: `POST /api/rooms/{room_id}/messages`

Request body phải accept:

```json
{
  "content": "ciphertext...",
  "encrypted_key": "...", // ⚠️ LƯU VÀO DB
  "iv": "..." // ⚠️ LƯU VÀO DB
}
```

### 4. REST API - GET Messages

Endpoint: `GET /api/rooms/{room_id}/messages`

Response phải include:

```json
[
  {
    "id": "...",
    "ciphertext": "...",
    "encrypted_key": "...", // ⚠️ BẮT BUỘC
    "iv": "..." // ⚠️ BẮT BUỘC
  }
]
```

---

## ✅ Checklist - Verify E2EE Works

- [ ] Frontend gửi tin: log `📤 Sending via WS` hiển thị `has_encrypted_key: true`
- [ ] Backend lưu vào DB: `encrypted_key` và `iv` không null
- [ ] Backend broadcast: log `📨 RAW WebSocket Message` hiển thị `has_encrypted_key: true`
- [ ] Người nhận decrypt realtime: log `✅✅✅ SUCCESS - Message decrypted!`
- [ ] Backend API trả về: log `🔍 RAW API RESPONSE` hiển thị `has_encrypted_key: true`
- [ ] Người nhận decrypt sau reload: tin nhắn hiển thị đúng
- [ ] Người gửi cache: log `💾 Cached plaintext` xuất hiện
- [ ] Người gửi reload: tin nhắn hiển thị từ cache
