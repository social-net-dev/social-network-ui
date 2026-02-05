# Message Feature

Tính năng nhắn tin thời gian thực với WebSocket, hỗ trợ reactions, pinned messages, và file uploads.

## 📁 Cấu trúc thư mục

```
message/
├── components/           # UI Components
│   ├── FilePreview.tsx      # Preview files trước khi gửi
│   ├── MessageActions.tsx   # Menu actions (pin, delete, react)
│   ├── MessageArea.tsx      # Vùng hiển thị messages
│   ├── MessageBubble.tsx    # Bubble cho từng message
│   ├── MessageInput.tsx     # Input để nhập tin nhắn
│   ├── MessageItem.tsx      # Container cho mỗi message
│   ├── MessageLayout.tsx    # Layout wrapper cho message
│   ├── MessageReactions.tsx # Hiển thị reactions
│   ├── PinnedMessages.tsx   # Danh sách messages được pin
│   ├── RoomSidebar.tsx      # Sidebar chọn room
│   └── SidebarRooms.tsx     # List rooms trong sidebar
├── hooks/                # Custom Hooks
│   ├── useChat.ts           # WebSocket chat logic
│   ├── useConversations.ts  # Fetch conversations
│   ├── useFileUpload.ts     # File upload logic
│   ├── useMessageManager.ts # Message fetching & merging
│   └── useRoomManager.ts    # Room CRUD operations
├── lib/                  # Utilities
│   └── chatClient.ts        # WebSocket client class
├── pages/                # Pages
│   ├── ConversationPage.tsx # Main chat page (264 lines)
│   └── MessageListPage.tsx  # List all conversations
├── services/             # API Services
│   └── messageApi.ts        # REST API calls
├── types/                # TypeScript Types
│   └── message.types.ts     # All message-related types
├── utils/                # Helper Functions
│   ├── messageDedupe.ts     # Deduplicate messages
│   └── messageHelpers.ts    # Date formatting, grouping
└── routes.tsx            # Route definitions
```

## 🧩 Components

### RoomSidebar

Sidebar hiển thị danh sách rooms và form tạo room mới.

**Props:**

- `rooms`: Danh sách rooms
- `selectedRoomId`: Room đang được chọn
- `userId`: User ID hiện tại
- `onRoomSelect`: Callback khi chọn room
- `onCreateRoom`: Callback khi tạo room mới

### MessageArea

Vùng hiển thị messages với pinned messages ở trên.

**Props:**

- `pinnedMessages`: Messages được pin
- `regularMessages`: Messages thường
- `currentUserId`: User ID hiện tại
- `chatStatus`: Trạng thái WebSocket
- `sendReaction`: Function gửi reaction
- `onRefresh`: Function refresh messages

### MessageInput

Input area với file preview và auto-resize textarea.

**Props:**

- `text`: Text hiện tại
- `selectedFiles`: Files được chọn
- `onTextChange`: Callback khi text thay đổi
- `onSend`: Callback khi gửi message
- `onFileSelect`: Callback khi chọn file

## 🎣 Hooks

### useRoomManager

Quản lý rooms (load, create).

**Returns:**

- `rooms`: Danh sách rooms
- `loading`: Loading state
- `createRoom(name, memberIds)`: Tạo room mới
- `loadRooms()`: Refresh rooms

### useMessageManager

Quản lý messages (fetch, merge, dedupe).

**Returns:**

- `combinedMessages`: Messages đã merge & dedupe
- `pinnedMessages`: Messages được pin
- `regularMessages`: Messages thường
- `loadMessages()`: Refresh messages

### useFileUpload

Quản lý file uploads với preview.

**Returns:**

- `selectedFiles`: Files được chọn
- `previews`: Preview URLs
- `handleFileSelect(e)`: Handler chọn file
- `removeFile(index)`: Xóa file
- `uploadFiles(text, setter)`: Upload files

### useChat

WebSocket chat connection với optimistic updates.

**Returns:**

- `messages`: Messages từ WebSocket
- `send(content)`: Gửi message
- `sendReaction(messageId, emoji)`: Gửi reaction
- `status`: Connection status
- `lastError`: Error message

## 🛠️ Utils

### messageDedupe.ts

Logic deduplicate messages từ WebSocket và REST.

**Functions:**

- `deduplicateMessages(ws, rest)`: Merge & dedupe
- `filterOptimisticMessage(fetched, new)`: Remove optimistic

### messageHelpers.ts

Helper functions cho UI.

**Functions:**

- `getDateSeparator(date)`: Format date ("Hôm nay", "Hôm qua", ...)
- `groupMessagesByDate(messages)`: Group messages theo ngày

## 📝 Best Practices

1. **Component Size**: Mỗi component nên < 200 dòng
2. **Hook Separation**: Tách logic phức tạp thành custom hooks
3. **Utils**: Tách pure functions vào utils/
4. **Types**: Define types rõ ràng trong types/
5. **Single Responsibility**: Mỗi file chỉ làm 1 việc

## 🔄 Data Flow

```
WebSocket → useChat → messages (realtime)
                       ↓
REST API → useMessageManager → fetchedMessages (historical)
                       ↓
              deduplicateMessages()
                       ↓
              combinedMessages → ConversationPage → MessageArea
```

## 📦 Dependencies

- `@tanstack/react-query`: (Planned) Server state management
- `zustand`: Global state (auth)
- `react-router-dom`: Routing

## 🚀 Future Improvements

- [ ] Add React Query for better caching
- [ ] Extract reaction logic to separate hook
- [ ] Add message search functionality
- [ ] Add typing indicators
- [ ] Add read receipts
- [ ] Add message editing
