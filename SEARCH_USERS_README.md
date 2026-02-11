# 🔍 Tính năng Tìm kiếm & Nhắn tin

## Tổng quan

Hệ thống cho phép người dùng:

- ✅ Tìm kiếm người dùng theo email hoặc username
- ✅ Xem thông tin profile (avatar, tên hiển thị, bio)
- ✅ Nhắn tin trực tiếp với một click
- ✅ Tự động tạo phòng chat 1-1
- ✅ Không cần nhập user_id thủ công nữa

## 🏗️ Kiến trúc

### 1. Profile API

**Endpoint**: `GET /api/profiles/{username}/`

**Headers**:

```typescript
{
  'x-tenant-slug': 't-bd8565ff-be35-454a-b873-db6c84498afd'
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "0edc4322-b329-47ba-9c21-5da5e34d7105",
    "username": "alice2@test.com",
    "display_name": "alice2",
    "birth_date": null,
    "bio": "",
    "avatar_path": ""
  },
  "request_id": "339f51e0-1262-4839-955d-c26323998e86"
}
```

### 2. User ID từ Tenant Slug

**Quy tắc**: User ID = Tenant Slug bỏ prefix "t-"

Ví dụ:

```typescript
tenant_slug: "t-bd8565ff-be35-454a-b873-db6c84498afd"
↓
user_id: "bd8565ff-be35-454a-b873-db6c84498afd"
```

**Helper Function**:

```typescript
export const extractUserIdFromTenantSlug = (tenantSlug: string): string => {
  if (tenantSlug && tenantSlug.startsWith('t-')) {
    return tenantSlug.substring(2); // Remove "t-" prefix
  }
  return tenantSlug;
};
```

### 3. Components

#### **SearchUsers** (Full Page)

- Component đầy đủ với search box lớn
- Hiển thị kết quả chi tiết
- Empty state khi chưa tìm kiếm
- Xử lý errors rõ ràng

**Location**: `src/features/home/components/SearchUsers.tsx`

**Usage**:

```tsx
import { SearchUsers } from '@/features/home/components/SearchUsers';

<SearchUsers />;
```

#### **SearchUsersMini** (Sidebar Widget)

- Compact design cho sidebar
- Tích hợp trong FeedPage
- Quick search & message
- Icon-based UI

**Location**: `src/features/home/components/SearchUsersMini.tsx`

**Usage**:

```tsx
import { SearchUsersMini } from '@/features/home/components/SearchUsersMini';

<SearchUsersMini />;
```

## 🚀 Cách sử dụng

### User Flow

1. **Tìm kiếm người dùng**
   - Nhập email hoặc username (vd: `alice2@test.com`)
   - Click "Tìm kiếm" hoặc nhấn Enter

2. **Xem kết quả**
   - Avatar + Display Name
   - Email/Username
   - Bio (nếu có)

3. **Nhắn tin**
   - Click nút "Nhắn tin"
   - Tự động tạo phòng chat 1-1
   - Navigate đến trang chat

### Technical Flow

```
User nhập search query
    ↓
Component gọi getProfile() API
    ↓
API trả về user data
    ↓
Hiển thị kết quả
    ↓
User click "Nhắn tin"
    ↓
Extract current user ID từ tenant_slug
    ↓
Gọi callCreateRoom() với member_ids
    ↓
Backend tạo/trả về room_id
    ↓
Navigate to /messages/{room_id}
```

## 📝 API Service

**File**: `src/lib/api/profileApi.ts`

```typescript
import api from '@/lib/api';
import type { ProfileResponse } from '@/types/profile.types';

export const getProfile = (username: string, tenantSlug: string) => {
  return api.get<ProfileResponse>(`/profiles/${username}/`, {
    headers: {
      'x-tenant-slug': tenantSlug,
    },
  });
};

export const extractUserIdFromTenantSlug = (tenantSlug: string): string => {
  if (tenantSlug && tenantSlug.startsWith('t-')) {
    return tenantSlug.substring(2);
  }
  return tenantSlug;
};
```

## 🎨 UI Components

### SearchUsers (Full Page)

**Features**:

- Large search input với placeholder hướng dẫn
- Loading state: "Đang tìm..."
- Error state: Hiển thị message rõ ràng
- Result card với avatar, info, action button
- Empty state với icon và message

**Classes**:

- Container: `max-w-2xl mx-auto p-6`
- Cards: `bg-card rounded-lg shadow p-6`
- Result: `bg-gray-50 dark:bg-gray-800 rounded-lg`

### SearchUsersMini (Sidebar)

**Features**:

- Compact form: Input + Icon button
- Small avatar (w-10 h-10)
- Truncated text để fit sidebar
- Icon-only "Nhắn tin" button

**Classes**:

- Follows sidebar card style
- Consistent with other sidebar widgets
- Mobile responsive

## 🔧 Auth Store Integration

**File**: `src/stores/authStore.ts`

**New Method**:

```typescript
interface AuthState {
  // ... existing fields
  getUserId: () => string | null;
}

// Implementation
getUserId: () => {
  const { tenantSlug } = get();
  return tenantSlug ? extractUserIdFromTenantSlug(tenantSlug) : null;
};
```

**Usage**:

```typescript
const getUserId = useAuthStore(state => state.getUserId);
const currentUserId = getUserId();
```

## 📦 Types

**File**: `src/types/profile.types.ts`

```typescript
export interface ProfileResponse {
  success: boolean;
  data: {
    id: string;
    username: string;
    display_name: string;
    birth_date: string | null;
    bio: string;
    avatar_path: string;
  };
  request_id: string;
}

export interface ProfileSearchParams {
  username: string;
  tenantSlug: string;
}
```

## 🧪 Testing

### Manual Testing

```bash
# 1. Start dev server
pnpm dev

# 2. Login với user account
# 3. Navigate to Feed page (home)
# 4. Sidebar sẽ hiển thị SearchUsersMini widget
# 5. Nhập email người dùng: alice2@test.com
# 6. Click Search hoặc Enter
# 7. Verify result hiển thị đúng
# 8. Click icon MessageCircle
# 9. Verify navigate đến /messages/{room_id}
```

### API Testing

```bash
# Test Profile API
curl -X GET http://localhost:8000/api/profiles/alice2@test.com/ \
  -H "x-tenant-slug: t-bd8565ff-be35-454a-b873-db6c84498afd" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response
{
  "success": true,
  "data": {
    "id": "0edc4322-b329-47ba-9c21-5da5e34d7105",
    "username": "alice2@test.com",
    "display_name": "alice2",
    "birth_date": null,
    "bio": "",
    "avatar_path": ""
  }
}
```

## 🔒 Security

### Headers Required

- ✅ `x-tenant-slug`: Để backend xác định tenant context
- ✅ `Authorization`: Bearer token (auto-added by axios interceptor)

### Validation

- Username search: Trim whitespace
- Không cho phép search khi query rỗng
- Error handling cho 404, 403, 500

## 🎯 Features Roadmap

- [ ] Search history (recent searches)
- [ ] Autocomplete suggestions
- [ ] Batch search (tìm nhiều users cùng lúc)
- [ ] Filter by location, interests, etc.
- [ ] Friend suggestions (based on mutual connections)
- [ ] Block/Unblock users
- [ ] Report inappropriate profiles

## 🐛 Known Issues

- [ ] Search không hỗ trợ fuzzy matching (phải match chính xác)
- [ ] Không cache kết quả search (gọi API mỗi lần)
- [ ] Chưa có rate limiting trên frontend

## 🔗 Related Files

### API

- `src/lib/api/profileApi.ts` - Profile API service
- `src/lib/axios-instance.ts` - Axios config với interceptors

### Components

- `src/features/home/components/SearchUsers.tsx` - Full page component
- `src/features/home/components/SearchUsersMini.tsx` - Sidebar widget
- `src/features/home/pages/FeedPage.tsx` - Integration point

### Types

- `src/types/profile.types.ts` - Profile types
- `src/features/message/types/message.types.ts` - Message/Room types

### Stores

- `src/stores/authStore.ts` - Auth state + getUserId()

## 💡 Tips

### Performance

- Debounce search input nếu thêm autocomplete
- Cache profile results trong React Query
- Lazy load avatar images

### UX

- Thêm loading skeleton cho result
- Hiển thị "... người dùng tìm thấy" counter
- Thêm animation khi result xuất hiện

### Accessibility

- Keyboard navigation (Tab, Enter)
- Screen reader support
- Focus management
