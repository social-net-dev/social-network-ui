# 🔥 PUBLIC KEY STALE - VẤN ĐỀ QUAN TRỌNG NHẤT!

## ❌ NGUYÊN NHÂN GỐC RỄ DECRYPT FAIL:

**Backend trả đủ data** (confirmed) NHƯNG vẫn **OperationError** khi decrypt!

### Tình huống:

1. **User A** đăng nhập lần đầu → generate keypair (public + private) → POST public key lên backend
2. **User B** muốn gửi tin cho User A → fetch public key của User A → encrypt → gửi
3. **User A** clear localStorage (hoặc login từ browser khác) → generate keypair **MỚI**
4. **User A** POST public key mới lên backend → Backend trả **409 Conflict** (key đã tồn tại)
5. **Frontend bỏ qua 409** → Backend **VẪN LƯU KEY CŨ**!
6. **User B** gửi tin tiếp → fetch public key của User A → **LẤY KEY CŨ** từ backend!
7. **User B** encrypt với **public key CŨ** → gửi tin
8. **User A** nhận tin → decrypt với **private key MỚI** → **KHÔNG KHỚP** → **OperationError**! 🔴

### Console Error:

```
❌ [E2EE] Decryption failed: OperationError
   1. This message was encrypted with a DIFFERENT public key
   2. Your private key does NOT match the public key used for encryption
   3. This could be an OLD message (encrypted before clearing localStorage)
   4. Or sender encrypted for WRONG recipient
```

---

## 🛠️ FIX BACKEND - BẮT BUỘC PHẢI LÀM!

### 1. Thêm PUT Endpoint để UPDATE Public Key

File: `router/e2ee.py` hoặc `router/user.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime

router = APIRouter()

@router.put("/users/public_key")
async def update_public_key(
    payload: PublicKeyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    UPDATE/OVERWRITE public key cho user hiện tại.

    CRITICAL: Dùng khi user clear localStorage và generate keypair mới.
    PHẢI OVERWRITE key cũ để các user khác encrypt với key mới!
    """
    repo = E2EERepository()

    # UPSERT: INSERT if not exists, UPDATE if exists
    try:
        await repo.upsert_public_key(
            user_id=current_user.id,
            public_key=payload.public_key
        )

        print(f"✅ [E2EE] Public key UPDATED for user {current_user.id[:8]}...")
        print(f"   New key preview: {payload.public_key[:40]}...")

        return {
            "user_id": str(current_user.id),
            "public_key": payload.public_key,
            "updated_at": datetime.now().isoformat(),
            "status": "updated"
        }
    except Exception as e:
        print(f"❌ [E2EE] Failed to update public key: {e}")
        raise HTTPException(status_code=500, detail="Failed to update public key")
```

### 2. Repository UPSERT Logic

File: `repository/e2ee_repository.py` hoặc `repository/user_repository.py`

#### PostgreSQL:

```python
class E2EERepository:
    async def upsert_public_key(self, user_id: str, public_key: str):
        """
        INSERT nếu chưa có, UPDATE nếu đã có.
        """
        query = """
            INSERT INTO user_public_keys (user_id, public_key, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE SET
                public_key = EXCLUDED.public_key,
                updated_at = NOW()
            RETURNING public_key, updated_at
        """
        result = await self.db.fetchone(query, user_id, public_key)
        return result
```

#### MySQL:

```python
async def upsert_public_key(self, user_id: str, public_key: str):
    query = """
        INSERT INTO user_public_keys (user_id, public_key, updated_at)
        VALUES (%s, %s, NOW())
        ON DUPLICATE KEY UPDATE
            public_key = VALUES(public_key),
            updated_at = NOW()
    """
    await self.db.execute(query, user_id, public_key)
    return public_key
```

---

## 🔧 FIX FRONTEND (ĐÃ FIX ✅)

### 1. Always Fetch FRESH Public Key Before Encrypt

**File**: `src/features/message/hooks/useE2EEMessaging.ts`

```typescript
// ❌ CŨ (SAI):
let recipientPublicKey = await getUserPublicKey(recipientId);
if (!recipientPublicKey) {
  // Chỉ fetch khi chưa có cache
  recipientPublicKey = await fetchFromServer();
}

// ✅ MỚI (ĐÚNG):
// ALWAYS fetch FRESH key từ server mỗi lần encrypt
const response = await callGetRoomMemberPublicKeys(roomId);
const recipientMember = response.data?.members.find(m => m.user_id === recipientId);
recipientPublicKey = await importPublicKey(recipientMember.public_key);
```

**Lý do**: Cache có thể bị stale → PHẢI fetch mới mỗi lần để đảm bảo dùng key mới nhất!

### 2. Call PUT When POST Returns 409

**File**: `src/features/message/hooks/useE2EEMessaging.ts`

```typescript
// Step 3: Upload public key to backend
try {
  await callSetPublicKey({ user_id: userId, public_key: myPublicKey });
  console.log('✅ Public key uploaded');
} catch (error: any) {
  if (error?.response?.status === 409) {
    // Key exists → UPDATE with new key
    console.log('⚠️ Public key conflict - attempting UPDATE...');
    try {
      await callUpdatePublicKey({ user_id: userId, public_key: myPublicKey });
      console.log('✅ Public key UPDATED (overwrote old key)');
    } catch (updateError) {
      console.error('❌ CRITICAL: Failed to UPDATE public key!');
      console.error('🚨 Other users will encrypt with OLD key → you CANNOT decrypt!');
    }
  }
}
```

---

## 🧪 TEST SCENARIO

### Bước 1: User A generate key mới

1. User A clear localStorage: `localStorage.clear()` → reload page
2. Check console → phải thấy:
   ```
   ✅ [E2EE] RSA keypair initialized
   ✅ [E2EE] Public key UPDATED successfully (overwrote old key)
   ```
3. Check backend logs → phải thấy:
   ```
   ✅ [E2EE] Public key UPDATED for user bd8565ff...
   ```
4. Check database:
   ```sql
   SELECT user_id, LEFT(public_key, 40), updated_at
   FROM user_public_keys
   WHERE user_id = 'bd8565ff...';
   ```
   → `updated_at` phải là thời điểm vừa rồi (không phải thời điểm cũ)

### Bước 2: User B gửi tin cho User A

1. User B gửi tin: "Hello User A"
2. Check console User B → phải thấy:
   ```
   🔄 ALWAYS fetching FRESH recipient public key from server...
   ✅ Fetched FRESH recipient public key from server
   ✅ [E2EE] Double encryption successful!
   ```
3. Check console User A → phải thấy:
   ```
   📥 [ChatClient] Message mapped from WebSocket: { has_encrypted_key_recipient: true }
   🔓 [E2EE] Decrypting message from ...
   ✅ [E2EE] Decryption successful!
   ```

**✅ PASS**: User A decrypt được tin từ User B (dù đã clear localStorage trước đó)

**❌ FAIL**: User A thấy `OperationError` → Backend chưa implement PUT endpoint!

---

## 📊 DATABASE SCHEMA

Bảng `user_public_keys`:

```sql
CREATE TABLE user_public_keys (
    user_id VARCHAR(255) PRIMARY KEY,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for quick lookup
CREATE INDEX idx_user_public_keys_user_id ON user_public_keys(user_id);
```

**QUAN TRỌNG**:

- `user_id` là PRIMARY KEY → ON CONFLICT sẽ UPDATE
- `updated_at` track thời điểm key được update gần nhất

---

## ❓ DEBUG CHECKLIST

Nếu vẫn gặp OperationError sau khi fix:

### 1. Check Backend Có PUT Endpoint Chưa?

```bash
curl -X PUT "http://localhost:8000/api/users/public_key" \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"xxx","public_key":"yyy"}'
```

**Expected**: HTTP 200 + response `{"status":"updated"}`

**Not Expected**: HTTP 404 / 405 → Backend chưa có endpoint!

### 2. Check Database - Key Có Được UPDATE Không?

```sql
-- Before clear localStorage
SELECT user_id, LEFT(public_key, 40) as key_preview, updated_at
FROM user_public_keys
WHERE user_id = 'bd8565ff...';
-- Note: updated_at = 2026-02-12 10:00:00

-- User clear localStorage → generate new key → POST/PUT

-- After
SELECT user_id, LEFT(public_key, 40) as key_preview, updated_at
FROM user_public_keys
WHERE user_id = 'bd8565ff...';
-- Expected:
--   key_preview KHÁC với trước
--   updated_at = 2026-02-12 16:10:00 (mới hơn!)
```

**PASS**: `public_key` và `updated_at` ĐỀU THAY ĐỔI

**FAIL**: `public_key` hoặc `updated_at` KHÔNG ĐỔI → Backend chưa UPDATE!

### 3. Check Frontend Console

```
🔄 ALWAYS fetching FRESH recipient public key from server...
✅ Fetched FRESH recipient public key from server
```

**PASS**: Mỗi lần encrypt đều fetch lại từ server

**FAIL**: Không thấy log "ALWAYS fetching" → Code cũ chưa update!

---

## 🎯 TÓM TẮT - ĐỌC ĐI ĐỌC LẠI:

**VẤN ĐỀ GỐC**: Backend không cho UPDATE public key → lưu key cũ mãi → encrypt fail!

**GIẢI PHÁP**:

1. **Backend**: Thêm PUT `/api/users/public_key` với logic UPSERT
2. **Frontend**:
   - ALWAYS fetch fresh public key trước khi encrypt
   - Call PUT khi POST trả 409

**TEST**:

- User clear localStorage → reload
- Check database `updated_at` có thay đổi?
- User khác gửi tin → có decrypt được không?

**NẾU VẪN FAIL**:

- Check backend có PUT endpoint chưa?
- Check database key có được UPDATE chưa?
- Check frontend console log

**QUAN TRỌNG**:

- Backend PHẢI OVERWRITE key cũ khi user generate key mới!
- Frontend PHẢI fetch fresh key mỗi lần encrypt!
- Nếu thiếu 1 trong 2 → OperationError! 🔴

FIX NGAY BÂY GIỜ! 🚀
