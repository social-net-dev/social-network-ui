# 🚨 Fix Lỗi: "Không thể giải mã sau reload"

## Triệu chứng:

- ✅ Realtime decrypt được (khi vừa gửi)
- ❌ Reload lại không decrypt được → Hiện "[Không thể giải mã...]"

---

## 🔍 Kiểm tra ngay:

### Bước 1: Reload page ở người NHẬN

### Bước 2: Mở Console (F12)

### Bước 3: Tìm log này:

```
🔍 ==================== API LOAD MESSAGES ====================
[useMessageManager] Message 1/5: {
  id: 'abc12345...',
  sender: 'bd8565ff...',
  has_encrypted_key: ???,  // ⚠️ CHECK NÀY!
  has_iv: ???,              // ⚠️ CHECK NÀY!
  encrypted_key_length: 0,  // ⚠️ NẾU = 0 → BACKEND LỖI!
  iv_length: 0,             // ⚠️ NẾU = 0 → BACKEND LỖI!
}
```

---

## 🚨 Nếu thấy `has_encrypted_key: false` hoặc `encrypted_key_length: 0`

### → BACKEND KHÔNG TRẢ VỀ `encrypted_key` và `iv`!

**Backend cần fix:**

#### 1. Check database có lưu không?

```sql
SELECT id, encrypted_key, iv
FROM messages
WHERE room_id = '...'
LIMIT 5;
```

**Nếu `encrypted_key` và `iv` là NULL:**
→ Backend không lưu khi nhận tin nhắn!

#### 2. Check API endpoint có select không?

```python
# ❌ SAI - Không select encrypted_key và iv
@app.get("/api/rooms/{room_id}/messages")
def get_messages(room_id: str):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).all()
    return messages  # Thiếu encrypted_key và iv!

# ✅ ĐÚNG - Phải select đầy đủ
@app.get("/api/rooms/{room_id}/messages")
def get_messages(room_id: str):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).all()

    return [
        {
            "id": msg.id,
            "ciphertext": msg.ciphertext,
            "encrypted_key": msg.encrypted_key,  # ⚠️ BẮT BUỘC!
            "iv": msg.iv,                        # ⚠️ BẮT BUỘC!
            "sender_id": msg.sender_id,
            "room_id": msg.room_id,
            "created_at": msg.created_at,
        }
        for msg in messages
    ]
```

---

## 🧪 Test nhanh backend:

### Dùng curl hoặc Postman:

```bash
curl http://localhost:8001/api/rooms/{room_id}/messages
```

**Check response:**

```json
[
  {
    "id": "...",
    "ciphertext": "...",
    "encrypted_key": "...", // ⚠️ CÓ FIELD NÀY KHÔNG?
    "iv": "...", // ⚠️ CÓ FIELD NÀY KHÔNG?
    "sender_id": "...",
    "room_id": "..."
  }
]
```

**Nếu KHÔNG CÓ hoặc NULL:**
→ Backend thiếu fix → Gửi tôi backend code để fix!

---

## ✅ Nếu `has_encrypted_key: true` nhưng vẫn lỗi decrypt:

### → Public key không khớp!

**Nguyên nhân:**

1. Tin nhắn được mã hóa bằng **public key CŨ**
2. User clear localStorage → key **MỚI**
3. Private key mới không decrypt được tin nhắn cũ

**Giải pháp:**

1. **GỬI TIN NHẮN MỚI** → Sẽ dùng public key hiện tại
2. Tin nhắn CŨ không decrypt được là BÌNH THƯỜNG
3. Nếu muốn decrypt tin cũ → KHÔNG ĐƯỢC clear localStorage!

---

## 📝 Checklist Debug:

1. [ ] Reload page ở người NHẬN
2. [ ] Mở Console (F12)
3. [ ] Tìm log `🔍 API LOAD MESSAGES`
4. [ ] Check `has_encrypted_key` và `encrypted_key_length`
5. [ ] Nếu = false/0 → Backend thiếu trả về → Fix backend
6. [ ] Nếu = true nhưng decrypt failed → Gửi tin nhắn MỚI để test
7. [ ] Screenshot logs và gửi cho tôi nếu vẫn lỗi

---

## 🔧 Backend Fix Template:

### Python FastAPI:

```python
# In your Message model (SQLAlchemy)
class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True)
    room_id = Column(String, nullable=False)
    sender_id = Column(String, nullable=False)
    ciphertext = Column(Text, nullable=False)
    encrypted_key = Column(Text, nullable=True)  # ⚠️ PHẢI CÓ COLUMN NÀY!
    iv = Column(Text, nullable=True)              # ⚠️ PHẢI CÓ COLUMN NÀY!
    created_at = Column(DateTime, default=datetime.utcnow)

# In your API endpoint
@app.get("/api/rooms/{room_id}/messages")
async def get_room_messages(room_id: str):
    messages = db.query(Message).filter(
        Message.room_id == room_id
    ).order_by(Message.created_at.desc()).limit(100).all()

    return [
        {
            "id": msg.id,
            "room_id": msg.room_id,
            "sender_id": msg.sender_id,
            "ciphertext": msg.ciphertext,
            "encrypted_key": msg.encrypted_key,  # ⚠️ BẮT BUỘC TRẢ VỀ!
            "iv": msg.iv,                        # ⚠️ BẮT BUỘC TRẢ VỀ!
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
            # ... other fields
        }
        for msg in messages
    ]
```

---

## 🆘 Cần hỗ trợ:

**Gửi cho tôi:**

1. Screenshot console logs (phần `🔍 API LOAD MESSAGES`)
2. Backend code (API endpoint `/api/rooms/{room_id}/messages`)
3. Database schema (table `messages`)

Tôi sẽ fix ngay!
