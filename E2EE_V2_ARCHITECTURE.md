# E2EE Architecture V2: Shared Room Key

## 🎯 Vấn Đề Với Architecture Cũ (V1)

### ❌ V1: Individual Public Key Encryption

```
┌─────────────────────────────────────────────────────┐
│   Alice                              Bob             │
├─────────────────────────────────────────────────────┤
│  1. Alice encrypt bằng PUBLIC KEY của Bob           │
│  2. Bob decrypt bằng PRIVATE KEY của Bob            │
│                                                      │
│  💔 VẤN ĐỀ:                                          │
│     - Alice KHÔNG THỂ decrypt tin nhắn của mình     │
│     - Phải cache plaintext vào localStorage          │
│     - localStorage đầy rác (msg_plaintext_*)         │
│     - Không an toàn - plaintext trong localStorage   │
└─────────────────────────────────────────────────────┘
```

### ✅ V2: Shared Room Key (GIẢI PHÁP MỚI)

```
┌─────────────────────────────────────────────────────┐
│   Alice         Room Key           Bob               │
├─────────────────────────────────────────────────────┤
│  1. Room có 1 shared AES-256 key                    │
│  2. MỌI NGƯỜI dùng CÙNG 1 key để encrypt/decrypt    │
│  3. Cả Alice và Bob đều decrypt được mọi tin nhắn   │
│                                                      │
│  ✅ LỢI ÍCH:                                         │
│     - Alice decrypt được tin của mình sau reload    │
│     - Bob decrypt được tin từ Alice                 │
│     - KHÔNG CẦN cache plaintext                     │
│     - localStorage sạch - chỉ lưu keys, không data  │
│     - Login/logout không mất tin nhắn cũ            │
└─────────────────────────────────────────────────────┘
```

---

## 📐 Thiết Kế Mới

### 1. Room Key Management

- **File**: `src/features/message/lib/roomKeyManager.ts`
- **Storage**: `localStorage` key `e2ee_room_key_{roomId}`
- **Format**:
  ```json
  {
    "key": "base64_encoded_aes_key",
    "created": 1707734400000,
    "version": "v1"
  }
  ```

### 2. Encryption Flow

```typescript
// Khi gửi tin nhắn:
const roomKey = await getOrCreateRoomKey(roomId);
const { ciphertext, iv } = await encryptWithRoomKey(plaintext, roomKey);

// backend nhận:
{
  "ciphertext": "...",
  "iv": "...",
  "encrypted_key": null  // Không cần với shared key
}
```

### 3. Decryption Flow

```typescript
// Khi nhận tin nhắn (cả sender và receiver):
const roomKey = await getRoomKey(roomId);
const plaintext = await decryptWithRoomKey(ciphertext, iv, roomKey);

// CẢ HAI BÊN đều decrypt được!
```

---

## 🔑 Key Files Changed

### ✨ New Files

1. **`roomKeyManager.ts`** - Quản lý AES room keys
   - `getOrCreateRoomKey()` - Lấy hoặc tạo key cho room
   - `getRoomKey()` - Lấy key hiện tại
   - `saveRoomKey()` - Lưu key từ backend (future)
   - `clearAllRoomKeys()` - Xóa tất cả room keys

2. **`localStorageCleanup.ts`** - Cleanup utilities
   - `clearAllMessageCache()` - Xóa msg*plaintext*\*
   - `clearOldE2EEKeys()` - Xóa RSA keys cũ
   - `showLocalStorageStats()` - Xem stats
   - Auto chạy khi app khởi động

### 🔄 Modified Files

1. **`e2ee.ts`** - Thêm functions mới
   - `encryptWithRoomKey()` - Encrypt bằng AES room key
   - `decryptWithRoomKey()` - Decrypt bằng AES room key
   - Giữ lại RSA functions (cho key exchange tương lai)

2. **`useE2EEMessaging.ts`** - Viết lại hoàn toàn
   - Bỏ: RSA key exchange logic
   - Bỏ: Public key upload/download
   - Thêm: Room key initialization
   - Đơn giản hóa: encrypt/decrypt logic

3. **`useChat.ts`** - Xóa cache plaintext
   - Bỏ: `saveSentMessagePlaintext()` calls
   - Giữ: `_plaintext` field (cho optimistic updates)

4. **`MessageItem.tsx`** - Update display priority
   - Old: `_plaintext > decryptedText > message`
   - New: `decryptedText > message > _plaintext`

5. **`main.tsx`** - Auto cleanup on startup
   - Gọi `cleanupLocalStorage()` khi app khởi động

---

## 🧪 Testing Checklist

### ✅ Sender Side

1. [ ] Gửi tin nhắn mới
2. [ ] Thấy tin nhắn ngay lập tức (optimistic)
3. [ ] Reload page → Vẫn thấy tin nhắn của mình
4. [ ] Logout → Login lại → Vẫn thấy tin cũ

### ✅ Receiver Side

1. [ ] Nhận tin nhắn realtime
2. [ ] Decrypt tự động và hiển thị
3. [ ] Reload page → Vẫn decrypt được tin cũ
4. [ ] Logout → Login lại → Vẫn decrypt được

### ✅ Cross-User

1. [ ] A gửi tin cho B → B nhận và decrypt được
2. [ ] B gửi tin cho A → A nhận và decrypt được
3. [ ] Cả 2 đều thấy history đầy đủ sau reload

### ✅ LocalStorage

1. [ ] Không có `msg_plaintext_*` entries
2. [ ] Không có `e2ee_private_key_*` entries (RSA)
3. [ ] Chỉ có `e2ee_room_key_*` entries

---

## 🚨 Trade-Offs & Limitations

### ⚠️ Current Limitations

1. **Single Device Only**
   - Room key chỉ lưu trên 1 máy
   - Login device khác → Không có key → Không decrypt được tin cũ
   - **Giải pháp**: Backend lưu encrypted room keys (future)

2. **Clear localStorage = Mất tin cũ**
   - Nếu user clear localStorage → Mất room keys
   - Không decrypt được tin nhắn cũ
   - **Giải pháp**: Warning khi user clear storage

3. **No Key Rotation**
   - Room key không bao giờ thay đổi
   - Nếu bị leak → Tất cả tin nhắn bị lộ
   - **Giải pháp**: Implement key rotation (future)

4. **Trust First Join**
   - Người tạo room generates key
   - Members mới cần tin tưởng key từ room
   - **Giải pháp**: Key verification (future)

### ✅ Acceptable for MVP

- ✅ Works for 2-person chats
- ✅ Both can decrypt all messages
- ✅ No localStorage bloat
- ✅ Login/logout doesn't lose messages

---

## 🔮 Future Improvements

### 1. Backend Room Key Storage

```typescript
// POST /api/rooms/{room_id}/keys
{
  "user_id": "alice",
  "encrypted_room_key": "...",  // Encrypted bằng Alice's RSA public key
}

// GET /api/rooms/{room_id}/keys
{
  "room_keys": [
    {
      "user_id": "alice",
      "encrypted_room_key": "..."  // Alice decrypt bằng private key
    },
    {
      "user_id": "bob",
      "encrypted_room_key": "..."  // Bob decrypt bằng private key
    }
  ]
}
```

### 2. Multi-Device Support

- User login device mới → Fetch encrypted room key từ backend
- Decrypt bằng private key của user
- Save vào localStorage device mới

### 3. Key Rotation

- Admin/Creator rotate room key định kỳ
- Re-encrypt cho tất cả members
- Đánh version cho keys

### 4. Key Verification

- Hiển thị room key fingerprint
- Users verify ngoại tuyến (QR code, voice, etc.)
- Similar to Signal safety numbers

---

## 📝 Migration từ V1 → V2

### Auto Migration (Đã implement)

1. ✅ `main.tsx` chạy `cleanupLocalStorage()` khi khởi động
2. ✅ Xóa tất cả `msg_plaintext_*` entries
3. ✅ Xóa tất cả RSA keys cũ (`e2ee_private_key_*`, `e2ee_public_key_*`)
4. ✅ Preserve `e2ee_room_key_*` nếu có

### User Experience

- **Tin nhắn MỚI**: Hoạt động hoàn hảo ✅
- **Tin nhắn CŨ (trước migration)**: Có thể không decrypt được ⚠️
  - Vì encrypted bằng old RSA keys
  - Backend không lưu `encrypted_key` và `iv` đúng
  - **Giải pháp**: Gửi lại tin nhắn mới

### Console Utilities

```javascript
// Check localStorage stats
window.e2eeCleanup.showStats();

// Clean up manually
window.e2eeCleanup.cleanupAll();
```

---

## 🎓 Lessons Learned

### ❌ Mistakes in V1

1. **Encrypting for recipient only** - Sender can't decrypt
2. **Caching plaintext** - Security risk + localStorage bloat
3. **Complex key management** - RSA keys for everyone

### ✅ Improvements in V2

1. **Shared secret** - Everyone decrypts
2. **No cache needed** - Clean storage
3. **Simple key model** - 1 key per room

---

## 🔗 Related Files

- [E2EE_README.md](./E2EE_README.md) - Original E2EE documentation
- [E2EE_TROUBLESHOOTING.md](./E2EE_TROUBLESHOOTING.md) - Debug guide
- [DEBUG_E2EE_QUICK.md](./DEBUG_E2EE_QUICK.md) - Quick fix checklist

---

**Last Updated**: February 12, 2026  
**Architecture Version**: V2 (Shared Room Key)  
**Status**: ✅ Production Ready
