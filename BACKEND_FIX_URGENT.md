# 🚨 BACKEND FIX KHẨN CẤP - E2EE KHÔNG DECRYPT ĐƯỢC

## VẤN ĐỀ HIỆN TẠI:

✅ Database ĐÃ LƯU đủ 2 cột: `encrypted_key_recipient` và `encrypted_key_sender`  
❌ Nhưng API **KHÔNG TRẢ VỀ** 2 fields này → Frontend không decrypt được!

### Hiện tượng:

1. **Realtime WebSocket**: Chỉ người gửi giải mã được, người nhận KHÔNG giải mã được
2. **Reload page**: CẢ HAI người KHÔNG giải mã được
3. **Database**: CÓ ĐẦY ĐỦ data (confirmed qua SQL query)

### Nguyên nhân:

- **GET `/api/rooms/{room_id}/messages`**: Response KHÔNG có `encrypted_key_recipient` và `encrypted_key_sender`
- **WebSocket broadcast**: Message KHÔNG có `encrypted_key_recipient` và `encrypted_key_sender`

---

## 🔧 FIX NGAY BÂY GIỜ:

### 1. GET Messages API (REST)

File: `router/message.py` hoặc tương tự

#### ❌ CODE SAI (hiện tại):

```python
@router.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
async def get_messages(room_id: str):
    repo = MessageRepository()
    messages = await repo.find_by_room(room_id)

    result = []
    for msg in messages:
        result.append({
            "id": str(msg.id),
            "room_id": str(msg.room_id),
            "sender_id": str(msg.sender_id),
            "ciphertext": msg.ciphertext,
            "encrypted_key": msg.encrypted_key,  # ❌ CHỈ CÓ 1 FIELD!
            "iv": msg.iv,
            "created_at": format_dt_to_vn(msg.created_at),
        })
    return result
```

#### ✅ CODE ĐÚNG (phải sửa thành):

```python
@router.get("/rooms/{room_id}/messages", response_model=List[MessageOut])
async def get_messages(room_id: str):
    repo = MessageRepository()
    messages = await repo.find_by_room(room_id)

    result = []
    for msg in messages:
        result.append({
            "id": str(msg.id),
            "room_id": str(msg.room_id),
            "sender_id": str(msg.sender_id),
            "ciphertext": msg.ciphertext,
            # ✅ TRẢ VỀ CẢ 3 FIELDS (backward compat)
            "encrypted_key": msg.encrypted_key_recipient or msg.encrypted_key,  # Backward compat
            "encrypted_key_recipient": msg.encrypted_key_recipient,  # ✅ BẮT BUỘC!
            "encrypted_key_sender": msg.encrypted_key_sender,  # ✅ BẮT BUỘC!
            "iv": msg.iv,
            "created_at": format_dt_to_vn(msg.created_at),
            "pinned": bool(msg.pinned) if hasattr(msg, 'pinned') else False,
            "reactions": [],
        })
    return result
```

**QUAN TRỌNG**:

- **PHẢI TRẢ VỀ CẢ 2 FIELDS**: `encrypted_key_recipient` và `encrypted_key_sender`
- Nếu không có → Frontend **KHÔNG THỂ DECRYPT**!

---

### 2. WebSocket Broadcast

File: `websocket/manager.py` hoặc handler WebSocket

#### ❌ CODE SAI (hiện tại):

```python
async def broadcast_to_room(self, room_id: str, data: dict):
    message = {
        "type": "message",
        "id": data.get("id"),
        "room_id": room_id,
        "sender_id": data["sender_id"],
        "message": data.get("message"),
        "ciphertext": data.get("ciphertext"),
        "encrypted_key": data.get("encrypted_key"),  # ❌ CHỈ CÓ 1 FIELD!
        "iv": data.get("iv"),
        "created_at": data.get("created_at"),
    }

    for client in self.room_connections.get(room_id, []):
        await client.send_json(message)
```

#### ✅ CODE ĐÚNG (phải sửa thành):

```python
async def broadcast_to_room(self, room_id: str, data: dict):
    message = {
        "type": "message",
        "id": data.get("id"),
        "room_id": room_id,
        "sender_id": data["sender_id"],
        "message": data.get("message"),
        "ciphertext": data.get("ciphertext"),
        # ✅ TRẢ VỀ CẢ 3 FIELDS
        "encrypted_key": data.get("encrypted_key_recipient") or data.get("encrypted_key"),  # Backward compat
        "encrypted_key_recipient": data.get("encrypted_key_recipient"),  # ✅ BẮT BUỘC!
        "encrypted_key_sender": data.get("encrypted_key_sender"),  # ✅ BẮT BUỘC!
        "iv": data.get("iv"),
        "created_at": data.get("created_at"),
    }

    for client in self.room_connections.get(room_id, []):
        await client.send_json(message)
```

**QUAN TRỌNG**:

- Sau khi `repo.insert(data)`, message object `msg` có sẵn 2 fields: `msg.encrypted_key_recipient` và `msg.encrypted_key_sender`
- **PHẢI** truyền 2 fields này vào `broadcast_to_room()`!

---

### 3. POST Message Response

File: `router/message.py`

#### ❌ CODE SAI (hiện tại - trong code bạn đã paste):

```python
return {
    "id": str(msg.id),
    "room_id": str(msg.room_id),
    "sender_id": str(msg.sender_id),
    "ciphertext": text,
    "encrypted_key_recipient": getattr(msg, 'encrypted_key_recipient', None),  # ✅ CÓ RỒI
    "encrypted_key_sender": getattr(msg, 'encrypted_key_sender', None),  # ✅ CÓ RỒI
    "iv": getattr(msg, 'iv', None),
    ...
}
```

👉 **POST response đã ĐÚNG RỒI!** Không cần sửa.

---

### 4. MessageOut Pydantic Model

File: `schemas/message.py` hoặc `models/message.py`

#### ❌ CODE SAI (hiện tại):

```python
class MessageOut(BaseModel):
    id: str
    room_id: str
    sender_id: str
    ciphertext: Optional[str]
    encrypted_key: Optional[str]  # ❌ CHỈ CÓ 1 FIELD!
    iv: Optional[str]
    created_at: str
```

#### ✅ CODE ĐÚNG (phải sửa thành):

```python
class MessageOut(BaseModel):
    id: str
    room_id: str
    sender_id: str
    ciphertext: Optional[str] = None
    # E2EE Double Encryption Fields
    encrypted_key: Optional[str] = None  # Backward compat alias
    encrypted_key_recipient: Optional[str] = None  # ✅ THÊM FIELD NÀY!
    encrypted_key_sender: Optional[str] = None  # ✅ THÊM FIELD NÀY!
    iv: Optional[str] = None
    created_at: str
    client_id: Optional[str] = None
    pinned: bool = False
    reactions: List[dict] = []
    attachments: Optional[List[dict]] = None
```

---

## 🧪 KIỂM TRA SAU KHI FIX:

### Test 1: GET Messages API

```bash
curl -X GET "http://localhost:8000/api/rooms/{room_id}/messages" \
     -H "Authorization: Bearer {token}"
```

**Expected Response** (mỗi message phải có):

```json
{
  "id": "msg_abc123",
  "sender_id": "user_alice",
  "ciphertext": "j8fK3nV9pL2mQw...",
  "encrypted_key": "MIIBIjANBgkqhkiG9w...",
  "encrypted_key_recipient": "MIIBIjANBgkqhkiG9w...", // ✅ PHẢI CÓ!
  "encrypted_key_sender": "MIIBIjANBgkqhkiG9w...", // ✅ PHẢI CÓ!
  "iv": "SGVsbG8gV29ybGQ=",
  "created_at": "2026-02-12T10:30:00Z"
}
```

Nếu **THIẾU** `encrypted_key_recipient` hoặc `encrypted_key_sender` → **FAIL**!

---

### Test 2: WebSocket Message

Gửi tin qua WebSocket, check console browser:

**Expected Log**:

```
📥 [ChatClient] Message mapped from WebSocket: {
  id: "msg_xxx",
  has_encrypted_key_recipient: true,   // ✅ PHẢI TRUE!
  has_encrypted_key_sender: true,      // ✅ PHẢI TRUE!
  encrypted_key_recipient_length: 344,
  encrypted_key_sender_length: 344,
  iv_length: 16
}
```

Nếu `has_encrypted_key_recipient: false` hoặc `has_encrypted_key_sender: false` → **FAIL**!

---

### Test 3: Database Query

```sql
SELECT
  id,
  sender_id,
  LENGTH(encrypted_key_recipient) as recipient_key_len,
  LENGTH(encrypted_key_sender) as sender_key_len,
  encrypted_key_recipient IS NOT NULL as has_recipient,
  encrypted_key_sender IS NOT NULL as has_sender
FROM messages
WHERE room_id = '{room_id}'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Result**:

```
| id  | sender_id | recipient_key_len | sender_key_len | has_recipient | has_sender |
|-----|-----------|-------------------|----------------|---------------|------------|
| ... | user_a    | 344               | 344            | true          | true       |
| ... | user_b    | 344               | 344            | true          | true       |
```

Nếu database có data nhưng API không trả về → **VẤN ĐỀ Ở API SELECT QUERY**!

---

## 📊 CHECKLIST FIX:

### Backend Engineer phải làm:

- [ ] **Sửa GET `/api/rooms/{room_id}/messages`**:
  - [ ] SELECT query phải include: `encrypted_key_recipient`, `encrypted_key_sender`
  - [ ] Response phải map 2 fields này
- [ ] **Sửa WebSocket `broadcast_to_room()`**:
  - [ ] Sau insert, lấy `msg.encrypted_key_recipient` và `msg.encrypted_key_sender`
  - [ ] Truyền 2 fields vào broadcast payload
- [ ] **Sửa Pydantic model `MessageOut`**:
  - [ ] Thêm field: `encrypted_key_recipient: Optional[str] = None`
  - [ ] Thêm field: `encrypted_key_sender: Optional[str] = None`

- [ ] **Test GET API**:

  ```bash
  curl http://localhost:8000/api/rooms/{room_id}/messages | jq '.[0] | {encrypted_key_recipient, encrypted_key_sender}'
  ```

  Phải thấy CẢ 2 fields có giá trị!

- [ ] **Test WebSocket**:
  - Gửi tin qua UI
  - Check browser console log
  - Phải thấy: `has_encrypted_key_recipient: true`, `has_encrypted_key_sender: true`

- [ ] **Test Decryption**:
  - User A gửi tin → User B nhận được → **User B phải decrypt được ngay lập tức**
  - User A reload page → **User A phải decrypt được tin của mình**
  - User B reload page → **User B phải decrypt được tin từ User A**

---

## 🎯 KẾT QUẢ MONG ĐỢI:

Sau khi fix xong:

✅ User A gửi tin cho User B → User B decrypt được NGAY (realtime)  
✅ User A reload → decrypt được tin của chính mình  
✅ User B reload → decrypt được tin từ User A  
✅ Console KHÔNG có lỗi `[E2EE] ⚠️ No encrypted_key for recipient`  
✅ Console thấy: `✅ [E2EE] Decryption successful!`

---

## ❓ NẾU VẪN LỖI:

### Debug Steps:

1. **Check Backend Logs**:

   ```python
   # Thêm log vào GET messages endpoint
   print("GET MESSAGES RESPONSE:", result[0])
   # Phải thấy: encrypted_key_recipient và encrypted_key_sender
   ```

2. **Check WebSocket Broadcast**:

   ```python
   # Thêm log vào broadcast function
   print("BROADCAST PAYLOAD:", message)
   # Phải thấy: encrypted_key_recipient và encrypted_key_sender
   ```

3. **Check Frontend Console**:
   - Open DevTools → Console
   - Filter: `E2EE`
   - Xem log: `📥 Message mapped from WebSocket` → phải thấy cả 2 fields
   - Xem log: `🔓 Decrypting message` → xem dùng key nào

4. **Check Database Raw Data**:
   ```sql
   SELECT
     id,
     SUBSTRING(encrypted_key_recipient, 1, 50) as recipient_preview,
     SUBSTRING(encrypted_key_sender, 1, 50) as sender_preview
   FROM messages
   WHERE id = 'msg_xxx';
   ```
   Phải thấy CẢ 2 cột có base64 string dài ~344 chars!

---

## 🔥 TÓM TẮT - ĐỌC ĐI ĐỌC LẠI:

**VẤN ĐỀ**: Database có đủ data, NHƯNG API không trả về!

**GIẢI PHÁP**:

1. GET API phải SELECT và MAP cả 2 fields
2. WebSocket broadcast phải INCLUDE cả 2 fields
3. Pydantic model phải DEFINE cả 2 fields

**TEST**:

- Gửi tin → check console → phải thấy `has_encrypted_key_recipient: true` + `has_encrypted_key_sender: true`
- Reload → check console → phải thấy `✅ Decryption successful!`

**NẾU THIẾU 1 TRONG 2 FIELDS** → Decrypt FAIL → Hiện `🔒 [Không thể giải mã]`

FIX NGAY BÂY GIỜ! 🚀
