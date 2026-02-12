# 🧪 TEST E2EE SAU KHI FIX BACKEND

## CHUẨN BỊ:

1. Backend đã fix xong (theo `BACKEND_FIX_URGENT.md`)
2. Frontend đã có code mới nhất (đã fix merge logic trong `useChat.ts`)
3. Mở 2 browser khác nhau (hoặc 2 tab incognito):
   - Browser A: Đăng nhập User A
   - Browser B: Đăng nhập User B

---

## ✅ TEST CASE 1: REALTIME MESSAGE (Quan trọng nhất!)

### Bước 1: User A gửi tin cho User B

**Browser A (User A)**:

1. Mở DevTools Console (F12)
2. Filter console: `E2EE`
3. Vào conversation với User B
4. Gửi tin: "Hello from User A"

**Expected Console Logs (User A)**:

```
📤 [ChatClient] Sending via WS: {
  has_encrypted_key_recipient: true,  // ✅
  has_encrypted_key_sender: true,     // ✅
  encrypted_key_recipient_length: 344,
  encrypted_key_sender_length: 344
}

✅ [E2EE] Double encryption successful!
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!
```

**Browser B (User B)** - NHẬN REALTIME:

```
📥 [ChatClient] Message mapped from WebSocket: {
  has_encrypted_key_recipient: true,  // ✅ PHẢI TRUE!
  has_encrypted_key_sender: true,     // ✅ PHẢI TRUE!
  encrypted_key_recipient_length: 344,
  encrypted_key_sender_length: 344
}

🔓 [E2EE] Decrypting message from ... (using encrypted_key)
✅ [E2EE] Decryption successful!
```

**✅ PASS**: User B thấy tin "Hello from User A" (plaintext, không mã hóa)

**❌ FAIL**: User B thấy `🔒 [Không thể giải mã]` hoặc ciphertext

---

### Bước 2: User B trả lời

**Browser B (User B)**:

1. Gửi tin: "Hello from User B"

**Expected Console Logs (User B)**:

```
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!
```

**Browser A (User A)** - NHẬN REALTIME:

```
📥 [ChatClient] Message mapped from WebSocket: {
  has_encrypted_key_recipient: true,  // ✅
  has_encrypted_key_sender: true,     // ✅
}

🔓 [E2EE] Decrypting message from ... (using encrypted_key)
✅ [E2EE] Decryption successful!
```

**✅ PASS**: User A thấy tin "Hello from User B" (plaintext)

**❌ FAIL**: User A thấy `🔒 [Không thể giải mã]`

---

## ✅ TEST CASE 2: RELOAD PAGE (Quan trọng!)

### Bước 3: User A reload page

**Browser A (User A)**:

1. Nhấn F5 (reload page)
2. Vào lại conversation với User B

**Expected Console Logs**:

```
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!

🔓 [E2EE] Decrypting message from ... (using encrypted_key_recipient)
✅ [E2EE] Decryption successful!
```

**✅ PASS**:

- Tin từ User A (của chính mình) → decrypt được với `encrypted_key_sender`
- Tin từ User B → decrypt được với `encrypted_key_recipient`

**❌ FAIL**: Bất kỳ tin nào hiện `🔒 [Không thể giải mã]`

---

### Bước 4: User B reload page

**Browser B (User B)**:

1. Nhấn F5 (reload page)
2. Vào lại conversation với User A

**Expected Console Logs**:

```
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!

🔓 [E2EE] Decrypting message from ... (using encrypted_key_recipient)
✅ [E2EE] Decryption successful!
```

**✅ PASS**: CẢ HAI loại tin đều decrypt được

**❌ FAIL**: Bất kỳ tin nào hiện `🔒 [Không thể giải mã]`

---

## ✅ TEST CASE 3: BACKEND API RAW CHECK

### Test GET Messages API

```bash
# Replace {room_id} và {token}
curl -X GET "http://localhost:8000/api/rooms/{room_id}/messages" \
     -H "Authorization: Bearer {token}" \
     | jq '.[0] | {id, encrypted_key_recipient, encrypted_key_sender, iv}'
```

**Expected Output**:

```json
{
  "id": "msg_abc123",
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...", // ✅ 344 chars
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...", // ✅ 344 chars
  "iv": "SGVsbG8gV29ybGQ=" // ✅ 16 chars
}
```

**✅ PASS**: CẢ 3 fields đều có giá trị (không null, không undefined)

**❌ FAIL**: Một trong 3 fields null/undefined → **Backend chưa fix đúng!**

---

## ✅ TEST CASE 4: DATABASE RAW CHECK

### Query trực tiếp vào Database

```sql
SELECT
  id,
  sender_id,
  LEFT(ciphertext, 30) as ciphertext_preview,
  LENGTH(encrypted_key_recipient) as recipient_len,
  LENGTH(encrypted_key_sender) as sender_len,
  LENGTH(iv) as iv_len,
  encrypted_key_recipient IS NOT NULL as has_recipient,
  encrypted_key_sender IS NOT NULL as has_sender,
  created_at
FROM messages
WHERE room_id = '{room_id}'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Output**:

```
| id  | sender_id | ciphertext_preview | recipient_len | sender_len | iv_len | has_recipient | has_sender | created_at |
|-----|-----------|--------------------|--------------:|------------|--------|---------------|------------|------------|
| ... | user_a    | j8fK3nV9pL2mQw...  | 344           | 344        | 16     | true          | true       | 2026-02-12 |
| ... | user_b    | LnDtZOEM1jV+fT...  | 344           | 344        | 16     | true          | true       | 2026-02-12 |
```

**✅ PASS**:

- `recipient_len` = 344
- `sender_len` = 344
- `has_recipient` = true
- `has_sender` = true

**❌ FAIL**: Một trong các field NULL hoặc length = 0

---

## 🐛 NẾU TEST FAIL - DEBUG STEPS

### Fail Case 1: Realtime không decrypt được (người nhận)

**Triệu chứng**: User B nhận tin từ User A → hiện `🔒 [Không thể giải mã]`

**Debug**:

1. Check console User B:

   ```
   📥 [ChatClient] Message mapped from WebSocket: {
     has_encrypted_key_recipient: ???,  // Check giá trị này
     has_encrypted_key_sender: ???,
   }
   ```

2. Nếu `has_encrypted_key_recipient: false`:
   - **Backend WebSocket broadcast CHƯA GỬI** `encrypted_key_recipient`!
   - → Fix backend `broadcast_to_room()` function

3. Nếu `has_encrypted_key_recipient: true` nhưng vẫn fail:
   - Check log:
     ```
     🔓 [E2EE] Decrypting message from ... (using encrypted_key)
     ❌ [E2EE] Decryption failed for message ...
     ```
   - → User B không phải là recipient đúng → Check recipientId logic frontend

---

### Fail Case 2: Reload không decrypt được

**Triệu chứng**: Sau reload, tất cả messages hiện `🔒 [Không thể giải mã]`

**Debug**:

1. Check Network tab → XHR → `/api/rooms/{room_id}/messages`
2. Xem Response → Click vào 1 message bất kỳ
3. Check có fields:

   ```json
   {
     "encrypted_key_recipient": "...", // ❓ Có không?
     "encrypted_key_sender": "..." // ❓ Có không?
   }
   ```

4. Nếu KHÔNG CÓ:
   - **Backend GET API CHƯA TRẢ VỀ** 2 fields này!
   - → Fix backend GET `/api/rooms/{room_id}/messages` endpoint

5. Nếu CÓ nhưng vẫn fail:
   - Check console log xem dùng key nào:
     ```
     🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
     ```
   - Hoặc:
     ```
     🔓 [E2EE] Decrypting message from ... (using encrypted_key_recipient)
     ```
   - → Check logic `isMine` trong `decryptIncoming()`

---

### Fail Case 3: Database có data nhưng API không trả về

**Triệu chứng**:

- SQL query thấy `encrypted_key_recipient` và `encrypted_key_sender` có data
- Nhưng API response không có 2 fields này

**Debug**:

1. Check backend code - GET messages endpoint:

   ```python
   # Phải SELECT cả 2 cột
   query = "SELECT id, sender_id, ciphertext, encrypted_key_recipient, encrypted_key_sender, iv, ... FROM messages WHERE room_id = ?"
   ```

2. Check response mapping:

   ```python
   result.append({
       "encrypted_key_recipient": msg.encrypted_key_recipient,  # ❓ Có dòng này không?
       "encrypted_key_sender": msg.encrypted_key_sender,        # ❓ Có dòng này không?
   })
   ```

3. Check Pydantic model `MessageOut`:
   ```python
   class MessageOut(BaseModel):
       encrypted_key_recipient: Optional[str] = None  # ❓ Có field này không?
       encrypted_key_sender: Optional[str] = None     # ❓ Có field này không?
   ```

---

## 📊 EXPECTED FINAL STATE

### Console Logs (sau khi tất cả test PASS):

**User A**:

```
✅ [E2EE] Double encryption successful!
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!
🔓 [E2EE] Decrypting message from ... (using encrypted_key_recipient)
✅ [E2EE] Decryption successful!
```

**User B**:

```
📥 [ChatClient] Message mapped from WebSocket: { has_encrypted_key_recipient: true, has_encrypted_key_sender: true }
🔓 [E2EE] Decrypting message from ... (using encrypted_key_recipient)
✅ [E2EE] Decryption successful!
🔓 [E2EE] Decrypting MY message ... (using encrypted_key_sender)
✅ [E2EE] Decryption successful!
```

**KHÔNG CÓ**:

- ❌ `🔒 [Không thể giải mã]`
- ❌ `⚠️ No encrypted_key for recipient`
- ❌ `❌ Decryption failed`
- ❌ Ciphertext hiển thị trên UI

---

## ✅ CHECKLIST CUỐI CÙNG

- [ ] Realtime: User A gửi → User B nhận và decrypt được ngay
- [ ] Realtime: User B gửi → User A nhận và decrypt được ngay
- [ ] Reload: User A reload → decrypt được TẤT CẢ messages (của mình + từ User B)
- [ ] Reload: User B reload → decrypt được TẤT CẢ messages (của mình + từ User A)
- [ ] API GET messages có cả 2 fields: `encrypted_key_recipient`, `encrypted_key_sender`
- [ ] WebSocket broadcast có cả 2 fields
- [ ] Database có data đầy đủ
- [ ] Console KHÔNG CÓ error `❌ [E2EE] Decryption failed`
- [ ] UI hiển thị plaintext, KHÔNG hiển thị `🔒 [Không thể giải mã]`

**NẾU TẤT CẢ CHECKBOXES ĐỀU ✅** → E2EE HOẠT ĐỘNG HOÀN HẢO! 🎉

**NẾU BẤT KỲ CHECKBOX NÀO ❌** → Xem phần DEBUG ở trên và fix tiếp! 🔧
