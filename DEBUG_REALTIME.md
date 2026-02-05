# 🔍 Hướng dẫn test Realtime Chat

## ✅ Cách test đúng (2 tabs):

### Tab 1 (Người gửi):

```
1. Mở: http://localhost:5173/messages
2. Điền:
   - user_id: user1
   - room_id: room123
3. Click "Áp dụng"
4. Gửi tin nhắn
```

### Tab 2 (Người nhận):

```
1. Mở: http://localhost:5173/messages
2. Điền:
   - user_id: user2  (KHÁC với Tab 1)
   - room_id: room123  (GIỐNG với Tab 1)
3. Click "Áp dụng"
4. Sẽ thấy tin nhắn từ Tab 1 realtime
```

## ⚠️ Lỗi thường gặp:

### 1. Không thấy tin nhắn

**Nguyên nhân**: 2 tabs dùng **khác room_id**
**Fix**: Phải dùng **cùng room_id**

### 2. Không nhận được broadcast

**Nguyên nhân**: WebSocket chưa connect
**Kiểm tra**: Xem status badge:

- 🟢 `open` = OK
- 🟡 `connecting` = Đang kết nối
- 🔴 `error` = Lỗi

### 3. Chỉ thấy tin nhắn của mình

**Nguyên nhân**: 2 tabs dùng **cùng user_id**
**Fix**: Mỗi tab phải dùng **khác user_id**

## 🐛 Debug Checklist:

```
Tab 1:
- user_id: ✅ user1
- room_id: ✅ room123
- status: ✅ open

Tab 2:
- user_id: ✅ user2 (KHÁC Tab 1)
- room_id: ✅ room123 (GIỐNG Tab 1)
- status: ✅ open

→ Gửi từ Tab 1 → Tab 2 thấy ngay lập tức
```

## 📊 Console logs:

Khi gửi tin nhắn, sẽ thấy:

```
[ChatClient] message received {type: 'message', ...}
[useChat] onMessage called
[ConversationPage] onMessage callback
```

Khi nhận broadcast:

```
[ChatClient] message received {type: 'message', sender_id: 'user1'}
[useChat] Adding message to state
```

## 🔧 Nếu vẫn lỗi:

1. **Check Backend WebSocket**: `ws://localhost:8000/ws`
2. **Check Console**: F12 → Console tab
3. **Check Network**: F12 → Network → WS tab
4. **Clear State**: Click "Xóa" để reset user_id và room_id
