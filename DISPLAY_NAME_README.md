# 👤 Display Name Feature

## Tổng quan

Tính năng cho phép user đặt tên hiển thị riêng trong từng phòng chat. Điều này hữu ích khi:

- User muốn sử dụng nickname khác nhau trong các nhóm khác nhau
- Cá nhân hóa tên hiển thị cho từng context
- Phân biệt vai trò trong các nhóm (Admin, Moderator, etc.)

## 🏗️ Kiến trúc

### Database Schema

```sql
-- Cột display_name trong bảng room_members
ALTER TABLE room_members ADD COLUMN display_name VARCHAR(255) NULL;
```

### API Endpoint

```python
@router.post('/rooms/{room_id}/members/{user_id}/display_name')
async def set_member_display_name(
    room_id: str,
    user_id: str,
    payload: DisplayNameIn
):
    """
    Đặt tên hiển thị cho user trong room cụ thể

    Args:
        room_id: ID của phòng chat
        user_id: ID của user
        payload: { display_name: str }

    Returns:
        {
            room_id: str,
            user_id: str,
            display_name: str
        }
    """
    # Validation
    if not payload.display_name or len(payload.display_name.strip()) == 0:
        raise HTTPException(400, "Display name không được để trống")

    if len(payload.display_name) > 100:
        raise HTTPException(400, "Display name quá dài (max 100 ký tự)")

    # Update database
    await db.execute(
        """
        UPDATE room_members
        SET display_name = :display_name
        WHERE room_id = :room_id AND user_id = :user_id
        """,
        {
            "display_name": payload.display_name.strip(),
            "room_id": room_id,
            "user_id": user_id
        }
    )

    return {
        "room_id": room_id,
        "user_id": user_id,
        "display_name": payload.display_name.strip()
    }
```

### Request/Response Types

```python
from pydantic import BaseModel, Field

class DisplayNameIn(BaseModel):
    display_name: str = Field(..., min_length=1, max_length=100)

class DisplayNameOut(BaseModel):
    room_id: str
    user_id: str
    display_name: str
```

## 🔧 Frontend Implementation

### API Service

```typescript
// src/features/message/services/messageApi.ts
export const callSetMemberDisplayName = (roomId: string, userId: string, payload: IDisplayNameRequest) => {
  return api.post<IDisplayNameResponse>(`/api/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(userId)}/display_name`, payload);
};
```

### Component Usage

```typescript
import { SetDisplayName } from '@/features/message/components/SetDisplayName';

// Trong MessageArea header hoặc RoomSidebar
<SetDisplayName
  roomId={roomId}
  userId={currentUserId}
  currentDisplayName={currentDisplayName}
  onSuccess={() => {
    // Refresh room data
    loadRooms();
  }}
/>
```

### Component Features

- ✅ Click để edit
- ✅ Inline editing với input
- ✅ Lưu & Hủy buttons
- ✅ Loading state
- ✅ Error handling
- ✅ Auto-focus khi mở edit mode

## 📋 Use Cases

### 1. Personal Chat

```
User A → Room "Team Alpha"
Display Name: "John (Designer)"

User A → Room "Family"
Display Name: "Johnny"
```

### 2. Professional vs Personal

```
User B → Work Room
Display Name: "Dr. Smith"

User B → Friends Room
Display Name: "Mike"
```

### 3. Role-based Names

```
Admin → Room "Customer Support"
Display Name: "Admin - Alex"

Moderator → Room "Customer Support"
Display Name: "Mod - Sarah"
```

## 🎨 UI/UX

### States

**1. Display Mode (không editing)**

```
[ Tên: Johnny ] ← Click để edit
```

**2. Edit Mode**

```
┌─────────────────────────────────────┐
│ [Input: Johnny     ] [Lưu] [Hủy]   │
└─────────────────────────────────────┘
```

**3. Loading State**

```
┌─────────────────────────────────────┐
│ [Input: Johnny     ] [Đang lưu...] │
└─────────────────────────────────────┘
```

### Placement

Display name setting được hiển thị ở:

- **MessageArea Header** (bên phải room title)
- Có thể thêm vào: RoomSidebar, User Settings

## 🔄 Data Flow

```
User Action
    ↓
SetDisplayName Component
    ↓
callSetMemberDisplayName API
    ↓
Backend: Update room_members.display_name
    ↓
Backend: Return success response
    ↓
Frontend: onSuccess callback
    ↓
Refresh room/member data
    ↓
UI updates with new display name
```

## 🚨 Validation

### Frontend

- Display name không được rỗng
- Alert nếu validation fail

### Backend

- Display name không được rỗng
- Max length: 100 characters
- Trim whitespace
- Return 400 Bad Request nếu invalid

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
pnpm dev

# 2. Navigate to messages page
# 3. Select a room
# 4. Click "Đặt tên hiển thị" button in header
# 5. Enter display name → Click Lưu
# 6. Verify name updated in UI
# 7. Refresh page → Verify name persisted
```

### API Testing

```bash
# Set display name
curl -X POST http://localhost:8000/api/rooms/{room_id}/members/{user_id}/display_name \
  -H "Content-Type: application/json" \
  -d '{"display_name": "Johnny Awesome"}'

# Response
{
  "room_id": "room_123",
  "user_id": "user_456",
  "display_name": "Johnny Awesome"
}
```

## 🔜 Future Enhancements

- [ ] Display name history/audit log
- [ ] Character limit indicator in UI
- [ ] Suggest display names based on user profile
- [ ] Display name templates (e.g., "Team Lead - {Name}")
- [ ] Emoji support in display names
- [ ] Display name search/filter in member list
- [ ] Bulk display name updates (e.g., add prefix "Team A -" to all members)

## 📝 Notes

- Display name chỉ hiển thị trong room cụ thể, không ảnh hưởng đến user profile global
- Nếu không set display name → Sử dụng username mặc định
- Display name có thể trùng giữa các users trong cùng room (không required unique)
- Admin có thể cần permission để sửa display name của user khác

## 🐛 Known Issues

- [ ] Display name không auto-update real-time cho các user khác trong room (cần WebSocket broadcast)
- [ ] Cần debounce nếu user spam click Lưu

## 🔗 Related Files

- `src/features/message/components/SetDisplayName.tsx` - Main component
- `src/features/message/services/messageApi.ts` - API calls
- `src/features/message/types/message.types.ts` - TypeScript types
- `src/features/message/components/MessageArea.tsx` - Integration point
