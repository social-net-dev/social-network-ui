# ✅ CHECKLIST - Test E2EE V2

## 🚀 BƯỚC 1: Chuẩn Bị

### 1.1. Clean LocalStorage

```javascript
// Mở Console (F12)
window.e2eeCleanup.cleanupAll();
```

**Expected Output**:

```
🧹 Starting localStorage cleanup...
🗑️ [Cleanup] Cleared X message plaintext cache entries
🗑️ [Cleanup] Cleared Y old E2EE RSA keys
✅ Cleanup complete!

📊 LOCAL STORAGE STATS
Total entries: Z
  - Message cache (msg_plaintext_*): 0 ✅
  - Old RSA keys (e2ee_*_key_*): 0 ✅
  - Room keys (e2ee_room_key_*): N ✅
```

### 1.2. Reload Page

```
F5 hoặc Ctrl+R
```

---

## 🧪 BƯỚC 2: Test Cơ Bản

### Test 2.1: Gửi Tin Nhắn Mới

**User A**:

1. [ ] Mở room chat với User B
2. [ ] Gửi tin: "Test E2EE V2 - Message 1"
3. [ ] Kiểm tra Console logs:
   ```
   🔐 [Room E2EE] Encrypting with shared room key...
   ✅ [Room E2EE] Encryption complete
   ```
4. [ ] Thấy tin nhắn ngay lập tức ✅

**User B**:

1. [ ] Nhận tin realtime
2. [ ] Kiểm tra Console logs:
   ```
   🔓 [Room E2EE] Decrypting message...
   ✅ [Room E2EE] Decryption successful
   ```
3. [ ] Thấy plaintext: "Test E2EE V2 - Message 1" ✅

---

## 🔄 BƯỚC 3: Test Reload

### Test 3.1: Sender Reload

**User A**:

1. [ ] Reload page (F5)
2. [ ] Vào lại room chat
3. [ ] Kiểm tra Console logs:
   ```
   📂 [RoomKey] Loaded existing key for room...
   🔓 [Room E2EE] Decrypting message...
   ✅ [Room E2EE] Decryption successful
   ```
4. [ ] Vẫn thấy tin "Test E2EE V2 - Message 1" ✅
5. [ ] **KHÔNG** thấy "[Tin nhắn đã gửi - không thể hiển thị]" ✅

### Test 3.2: Receiver Reload

**User B**:

1. [ ] Reload page (F5)
2. [ ] Vào lại room chat
3. [ ] Kiểm tra Console logs tương tự User A
4. [ ] Vẫn decrypt được tin từ User A ✅

---

## 💬 BƯỚC 4: Test 2-Way Communication

### Test 4.1: User B Reply

**User B**:

1. [ ] Gửi tin: "Test reply from B"
2. [ ] Thấy tin của mình ngay lập tức ✅
3. [ ] Reload → Vẫn thấy tin của mình ✅

**User A**:

1. [ ] Nhận tin realtime
2. [ ] Decrypt và hiển thị: "Test reply from B" ✅
3. [ ] Reload → Vẫn decrypt được ✅

### Test 4.2: Nhiều Tin Nhắn

**Both Users**:

1. [ ] Gửi qua lại 5-10 tin nhắn
2. [ ] Cả 2 đều thấy tất cả tin nhắn ✅
3. [ ] Reload → Cả 2 vẫn thấy đầy đủ history ✅

---

## 🔐 BƯỚC 5: Test Login/Logout

### Test 5.1: Logout và Login Lại

**User A**:

1. [ ] Logout
2. [ ] Login lại (KHÔNG xóa localStorage!)
3. [ ] Vào room chat
4. [ ] Vẫn thấy TẤT CẢ tin cũ ✅
5. [ ] Gửi tin mới → Vẫn hoạt động ✅

**User B**:

1. [ ] Lặp lại tương tự
2. [ ] Vẫn thấy đầy đủ history ✅

---

## 📊 BƯỚC 6: Kiểm Tra LocalStorage

### Test 6.1: Xem Stats

```javascript
// Console
window.e2eeCleanup.showStats();
```

**Expected**:

```
📊 LOCAL STORAGE STATS
Total entries: X
  - Message cache (msg_plaintext_*): 0 ✅  <- MUST BE 0!
  - Old RSA keys (e2ee_*_key_*): 0 ✅     <- MUST BE 0!
  - Room keys (e2ee_room_key_*): N ✅    <- 1 per room
  - Other: M
Total size: ~Y KB
```

### Test 6.2: Check Manually

**Chrome DevTools**:

1. [ ] F12 → Application → Storage → Local Storage
2. [ ] Filter: `msg_plaintext` → KHÔNG CÓ gì ✅
3. [ ] Filter: `e2ee_private_key` → KHÔNG CÓ gì ✅
4. [ ] Filter: `e2ee_public_key` → KHÔNG CÓ gì ✅
5. [ ] Filter: `e2ee_room_key` → CÓ 1 key per room ✅

---

## ❌ BƯỚC 7: Test Error Cases

### Test 7.1: Xóa Room Key

```javascript
// Console
localStorage.removeItem('e2ee_room_key_' + roomId);
```

**Expected**:

1. [ ] Reload page
2. [ ] Tin cũ KHÔNG decrypt được (hiện error message)
3. [ ] Gửi tin mới → Tạo key mới → Hoạt động bình thường ✅

### Test 7.2: Clear Toàn Bộ Storage

```javascript
// Console
localStorage.clear();
```

**Expected**:

1. [ ] Reload page
2. [ ] MẤT tất cả room keys
3. [ ] Tin cũ không decrypt được
4. [ ] Gửi tin mới → Tạo keys mới → Hoạt động ✅

---

## 🎯 EXPECTED RESULTS

### ✅ PASS Criteria

- [ ] Sender decrypt được tin của mình sau reload
- [ ] Receiver decrypt được tin nhận
- [ ] 2-way communication hoạt động
- [ ] Login/logout không mất tin cũ
- [ ] LocalStorage KHÔNG có `msg_plaintext_*`
- [ ] LocalStorage KHÔNG có RSA keys
- [ ] Console KHÔNG có lỗi E2EE

### ❌ FAIL Criteria

- [ ] Sender không thấy tin sau reload
- [ ] Receiver không decrypt được
- [ ] LocalStorage còn `msg_plaintext_*`
- [ ] Console có error decrypt

---

## 🆘 Nếu Test FAIL

### Debug Steps:

1. **Check Console Logs**:
   - Tìm `[Room E2EE]` logs
   - Xem có error không

2. **Check Room Key**:

   ```javascript
   // Console
   const roomId = 'your-room-id';
   const key = localStorage.getItem('e2ee_room_key_' + roomId);
   console.log('Room key exists:', !!key);
   ```

3. **Re-run Cleanup**:

   ```javascript
   window.e2eeCleanup.cleanupAll();
   // Reload (F5)
   // Test lại từ đầu
   ```

4. **Backend Check**:
   - Kiểm tra backend có lưu `ciphertext` và `iv` không
   - Dùng E2EEDebugPanel (nút "E2EE Debug" ở góc dưới)

---

## 📸 Screenshot Checklist

**Chụp màn hình để verify**:

1. [ ] Console logs khi encrypt
2. [ ] Console logs khi decrypt
3. [ ] LocalStorage stats (show 0 msg_plaintext)
4. [ ] Chat UI với tin nhắn đã decrypt
5. [ ] Chat UI sau reload (vẫn decrypt được)

---

## ✅ Final Verification

```javascript
// Console - Run tất cả checks
console.log('=== E2EE V2 Health Check ===');
console.log('1. Stats:', window.e2eeCleanup.showStats());
console.log('2. Room key exists:', !!localStorage.getItem('e2ee_room_key_' + roomId));
console.log('3. No msg_plaintext:', Object.keys(localStorage).filter(k => k.startsWith('msg_plaintext_')).length === 0);
console.log('4. No RSA keys:', Object.keys(localStorage).filter(k => k.startsWith('e2ee_private_key_')).length === 0);
console.log('=== All checks PASSED! ===');
```

---

**Test Date**: ****\_\_****  
**Tester**: ****\_\_****  
**Status**: ⬜ PASS / ⬜ FAIL  
**Notes**: ****************\_\_\_****************
