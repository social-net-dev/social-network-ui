# RECOMMENDATION MODULE - FRONTEND IMPLEMENTATION GUIDE

## 📋 MỤC LỤC

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Yêu cầu chức năng](#2-yêu-cầu-chức-năng)
3. [Cấu trúc module Frontend](#3-cấu-trúc-module-frontend)
4. [API Endpoints & Integration](#4-api-endpoints--integration)
5. [UI Components](#5-ui-components)
6. [Implementation Plan](#6-implementation-plan)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. TỔNG QUAN DỰ ÁN

### 1.1. Về Dự án Social Network

Đây là dự án mạng xã hội giáo dục ETECHS, kết nối học sinh - giáo viên - giảng viên. Dự án bao gồm:

**Frontend Stack:**

- React 18 + TypeScript
- Vite
- TanStack Query (React Query) - data fetching & caching
- React Router v6 - routing
- Axios - HTTP client
- Tailwind CSS + shadcn/ui - styling
- Zod - validation

**Backend Stack:**

- FastAPI (Python)
- PostgreSQL
- JWT Authentication
- MinIO - storage
- MailHog - email testing

**Architecture:**

```
Frontend (Port 5173)
    ↓
social-be (Port 8000) - API Proxy
    ↓
etechs-middleware (Port 8001) - Auth & Tenant Service
```

### 1.2. Cấu trúc thư mục hiện tại

```
src/
├── features/              # Feature-based modules
│   ├── auth/             # Authentication (Login, Register, OTP)
│   ├── admin/            # Admin dashboard
│   ├── home/             # Feed & Posts
│   ├── profile/          # User profiles
│   └── shared/           # Shared layouts
├── components/ui/        # shadcn/ui components
├── lib/                  # Utilities
│   ├── api.ts           # Axios instance & interceptors
│   ├── axios.ts         # Axios config
│   ├── query-keys.ts    # React Query keys
│   └── react-query.ts   # React Query client
├── stores/              # Zustand stores
├── types/               # TypeScript types
└── mocks/               # MSW mocks (dev mode)
```

### 1.3. Pattern & Conventions

**Module Structure (Feature-based):**

```
features/[feature-name]/
├── components/          # UI components
├── hooks/              # Custom hooks
├── pages/              # Page components
├── services/           # API services
├── types/              # TypeScript types
├── utils/              # Utilities
└── routes.tsx          # Routes config
```

**Naming Conventions:**

- Components: PascalCase (e.g., `FriendSuggestionCard.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useFriendRequests.ts`)
- Services: camelCase with `Api` suffix (e.g., `recommendationApi.ts`)
- Types: PascalCase (e.g., `RecommendationUser.ts`)

---

## 2. YÊU CẦU CHỨC NĂNG

### 2.1. Module: Network Recommendation (Mạng lưới kết nối)

**Mục tiêu:**
Hình thành đồ thị mạng xã hội có cấu trúc, phản ánh mối quan hệ thật giữa các người dùng (học sinh - học sinh, giáo viên - học sinh, giáo viên - giáo viên).

#### 2.1.1. Gợi ý kết nối (Friend Suggestions)

**Chức năng chính:**

- Gợi ý người dùng theo bối cảnh học tập (trường, lớp, môn học)
- Gợi ý theo môn học & sở thích chung
- Phân tích hồ sơ và hành vi người dùng
- Tạo danh sách gợi ý phân loại: HS-HS, GV-HS, GV-GV

**UI Requirements:**

- Danh sách gợi ý kết nối (card layout)
- Filter theo context: "Cùng trường", "Cùng lớp", "Cùng môn học"
- Hiển thị thông tin người dùng: avatar, tên, vai trò, số bạn chung
- Action buttons: "Kết nối", "Bỏ qua"

#### 2.1.2. Quản lý quan hệ người dùng

**Chức năng:**

- **Follow (Theo dõi):** Một chiều - theo dõi không cần chấp nhận
- **Connect (Kết nối/Kết bạn):** Hai chiều - cần chấp nhận

**Quy trình kết nối:**

1. Người dùng gửi yêu cầu kết nối
2. Hệ thống ghi nhận và thông báo bên nhận
3. Bên nhận chấp nhận hoặc từ chối
4. Hệ thống ghi nhận mối quan hệ
5. Người dùng có thể hủy kết nối

**UI Requirements:**

- Danh sách yêu cầu kết nối đến (incoming)
- Danh sách yêu cầu kết nối đã gửi (outgoing)
- Danh sách bạn bè (friends)
- Danh sách đang theo dõi (following)
- Danh sách người theo dõi (followers)
- Trạng thái kết nối trên profile: "Kết nối", "Đã gửi yêu cầu", "Chấp nhận", "Bạn bè"

#### 2.1.3. Nhóm học tập (Groups)

**Loại nhóm:**

- **Theo trường:** Cộng đồng lớn
- **Theo lớp:** Nhóm nhỏ
- **Theo môn:** Học tập chuyên sâu

**Chức năng:**

- Tạo nhóm
- Tham gia/Rời nhóm
- Danh sách thành viên
- Quản trị nhóm (admin)

**UI Requirements:**

- Danh sách nhóm (Grid/List view)
- Chi tiết nhóm
- Form tạo/chỉnh sửa nhóm
- Danh sách thành viên nhóm

#### 2.1.4. Phân tích mạng lưới (Analytics)

**Chức năng:**

- Thống kê kết nối chung
- Phân tích quan hệ
- Visualization đồ thị mạng (optional)

---

## 3. CẤU TRÚC MODULE FRONTEND

### 3.1. Tạo folder structure

```bash
src/features/recommendation/
├── components/
│   ├── FriendSuggestionCard.tsx      # Card gợi ý kết nối
│   ├── FriendRequestCard.tsx          # Card yêu cầu kết bạn
│   ├── FriendListItem.tsx             # Item trong danh sách bạn bè
│   ├── ConnectionStatusButton.tsx     # Button trạng thái kết nối
│   ├── GroupCard.tsx                  # Card nhóm học tập
│   ├── GroupMemberItem.tsx            # Item thành viên nhóm
│   ├── RecommendationFilters.tsx      # Filters gợi ý
│   └── NetworkAnalyticsChart.tsx      # Biểu đồ phân tích (optional)
├── hooks/
│   ├── useFriendSuggestions.ts        # Hook gợi ý kết nối
│   ├── useFriendRequests.ts           # Hook yêu cầu kết bạn
│   ├── useFriendsList.ts              # Hook danh sách bạn bè
│   ├── useConnectionActions.ts        # Hook actions (connect, accept, reject)
│   ├── useGroups.ts                   # Hook quản lý nhóm
│   └── useNetworkAnalytics.ts         # Hook analytics
├── pages/
│   ├── RecommendationPage.tsx         # Trang gợi ý kết nối
│   ├── FriendRequestsPage.tsx         # Trang yêu cầu kết bạn
│   ├── FriendsListPage.tsx            # Trang danh sách bạn bè
│   ├── GroupsPage.tsx                 # Trang danh sách nhóm
│   ├── GroupDetailPage.tsx            # Trang chi tiết nhóm
│   └── NetworkAnalyticsPage.tsx       # Trang phân tích mạng
├── services/
│   ├── recommendationApi.ts           # API gợi ý
│   ├── friendsApi.ts                  # API friends
│   └── groupsApi.ts                   # API groups
├── types/
│   ├── recommendation.types.ts        # Types cho recommendation
│   ├── friends.types.ts               # Types cho friends
│   └── groups.types.ts                # Types cho groups
├── utils/
│   └── recommendation.utils.ts        # Utilities
└── routes.tsx                          # Routes config
```

### 3.2. Types Definition

**File: `src/features/recommendation/types/recommendation.types.ts`**

```typescript
import { z } from "zod";

// User suggestion
export const SuggestedUserSchema = z.object({
    id: z.string(),
    username: z.string(),
    displayName: z.string(),
    avatar: z.string().nullable().optional(),
    role: z.enum(["STUDENT", "INSTRUCTOR", "TEACHER", "USER"]),
    bio: z.string().optional(),
    school: z.string().optional(),
    grade: z.string().optional(),
    mutualFriends: z.number().default(0),
    connectionReason: z.enum(["SAME_SCHOOL", "SAME_CLASS", "SAME_SUBJECT", "MUTUAL_FRIENDS", "SIMILAR_INTERESTS"]).optional(),
});

export type SuggestedUser = z.infer<typeof SuggestedUserSchema>;

// Friend request
export const FriendRequestSchema = z.object({
    id: z.string(),
    sender: SuggestedUserSchema,
    receiver: SuggestedUserSchema,
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"]),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
});

export type FriendRequest = z.infer<typeof FriendRequestSchema>;

// Friend
export const FriendSchema = z.object({
    id: z.string(),
    user: SuggestedUserSchema,
    connectedAt: z.string(),
    mutualFriends: z.number().default(0),
});

export type Friend = z.infer<typeof FriendSchema>;

// Connection status
export type ConnectionStatus =
    | "NOT_CONNECTED" // Chưa kết nối
    | "REQUEST_SENT" // Đã gửi yêu cầu
    | "REQUEST_RECEIVED" // Nhận được yêu cầu
    | "CONNECTED" // Đã kết nối
    | "FOLLOWING" // Đang theo dõi
    | "FOLLOWED_BY"; // Được theo dõi

export interface ConnectionAction {
    type: "SEND_REQUEST" | "ACCEPT" | "REJECT" | "CANCEL" | "UNFRIEND" | "FOLLOW" | "UNFOLLOW";
    userId: string;
}
```

**File: `src/features/recommendation/types/groups.types.ts`**

```typescript
import { z } from "zod";
import { SuggestedUserSchema } from "./recommendation.types";

export const GroupSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(["SCHOOL", "CLASS", "SUBJECT"]),
    avatar: z.string().nullable().optional(),
    coverImage: z.string().nullable().optional(),
    memberCount: z.number().default(0),
    isPublic: z.boolean().default(true),
    createdBy: SuggestedUserSchema,
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    // Metadata
    school: z.string().optional(),
    grade: z.string().optional(),
    subject: z.string().optional(),
});

export type Group = z.infer<typeof GroupSchema>;

export const GroupMemberSchema = z.object({
    id: z.string(),
    user: SuggestedUserSchema,
    role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]),
    joinedAt: z.string(),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;
```

---

## 4. API ENDPOINTS & INTEGRATION

### 4.1. Friends API (Đã có sẵn trong Backend)

**Base URL:** `http://localhost:8000`

#### Available Endpoints:

```typescript
// 1. Send friend request
POST /friends/requests
Headers: Authorization: Bearer {token}
Body: { "addressee_username": "username" }
Response: FriendRequest

// 2. Get incoming friend requests
GET /friends/requests/incoming
Headers: Authorization: Bearer {token}
Response: FriendRequest[]

// 3. Accept friend request
POST /friends/requests/{request_id}/accept
Headers: Authorization: Bearer {token}
Response: FriendRequest

// 4. Reject friend request
POST /friends/requests/{request_id}/reject
Headers: Authorization: Bearer {token}
Response: FriendRequest

// 5. Cancel friend request (outgoing)
DELETE /friends/requests/{request_id}
Headers: Authorization: Bearer {token}
Response: { success: boolean }

// 6. Get friends list
GET /friends
Headers: Authorization: Bearer {token}
Response: Friend[]

// 7. Unfriend
DELETE /friends/{friend_id}
Headers: Authorization: Bearer {token}
Response: { success: boolean }
```

### 4.2. Recommendation API (Cần implement Backend)

**⚠️ LƯU Ý:** Các endpoint này CHƯA có trong Backend, cần phối hợp với team BE để implement.

```typescript
// 1. Get friend suggestions
GET /recommendations/friends?context={context}&limit={limit}
Headers: Authorization: Bearer {token}
Query params:
  - context?: 'SAME_SCHOOL' | 'SAME_CLASS' | 'SAME_SUBJECT' | 'MUTUAL_FRIENDS'
  - limit?: number (default: 10)
Response: {
  suggestions: SuggestedUser[],
  total: number
}

// 2. Dismiss suggestion
POST /recommendations/friends/{user_id}/dismiss
Headers: Authorization: Bearer {token}
Response: { success: boolean }

// 3. Get connection status with user
GET /connections/status/{username}
Headers: Authorization: Bearer {token}
Response: {
  status: ConnectionStatus,
  requestId?: string  // if status is REQUEST_SENT or REQUEST_RECEIVED
}
```

### 4.3. Groups API (Cần implement Backend)

**⚠️ LƯU Ý:** Các endpoint này CHƯA có trong Backend, cần phối hợp với team BE để implement.

```typescript
// 1. Get all groups
GET /groups?type={type}&page={page}&limit={limit}
Headers: Authorization: Bearer {token}
Query params:
  - type?: 'SCHOOL' | 'CLASS' | 'SUBJECT'
  - page?: number (default: 1)
  - limit?: number (default: 20)
Response: {
  groups: Group[],
  total: number,
  page: number,
  totalPages: number
}

// 2. Get group detail
GET /groups/{group_id}
Headers: Authorization: Bearer {token}
Response: Group

// 3. Create group
POST /groups
Headers: Authorization: Bearer {token}
Body: {
  name: string,
  description?: string,
  type: 'SCHOOL' | 'CLASS' | 'SUBJECT',
  isPublic: boolean,
  school?: string,
  grade?: string,
  subject?: string
}
Response: Group

// 4. Update group
PATCH /groups/{group_id}
Headers: Authorization: Bearer {token}
Body: Partial<Group>
Response: Group

// 5. Delete group
DELETE /groups/{group_id}
Headers: Authorization: Bearer {token}
Response: { success: boolean }

// 6. Join group
POST /groups/{group_id}/join
Headers: Authorization: Bearer {token}
Response: GroupMember

// 7. Leave group
POST /groups/{group_id}/leave
Headers: Authorization: Bearer {token}
Response: { success: boolean }

// 8. Get group members
GET /groups/{group_id}/members
Headers: Authorization: Bearer {token}
Response: GroupMember[]

// 9. Get my groups
GET /groups/my
Headers: Authorization: Bearer {token}
Response: Group[]
```

### 4.4. Service Implementation

**File: `src/features/recommendation/services/friendsApi.ts`**

```typescript
import api from "@/lib/axios";
import type { FriendRequest, Friend } from "../types/friends.types";

export const friendsApi = {
    // Send friend request
    sendFriendRequest: async (username: string): Promise<FriendRequest> => {
        const response = await api.post<FriendRequest>("/friends/requests", {
            addressee_username: username,
        });
        return response.data;
    },

    // Get incoming requests
    getIncomingRequests: async (): Promise<FriendRequest[]> => {
        const response = await api.get<FriendRequest[]>("/friends/requests/incoming");
        return response.data;
    },

    // Accept request
    acceptRequest: async (requestId: string): Promise<FriendRequest> => {
        const response = await api.post<FriendRequest>(`/friends/requests/${requestId}/accept`);
        return response.data;
    },

    // Reject request
    rejectRequest: async (requestId: string): Promise<FriendRequest> => {
        const response = await api.post<FriendRequest>(`/friends/requests/${requestId}/reject`);
        return response.data;
    },

    // Cancel request
    cancelRequest: async (requestId: string): Promise<void> => {
        await api.delete(`/friends/requests/${requestId}`);
    },

    // Get friends list
    getFriendsList: async (): Promise<Friend[]> => {
        const response = await api.get<Friend[]>("/friends");
        return response.data;
    },

    // Unfriend
    unfriend: async (friendId: string): Promise<void> => {
        await api.delete(`/friends/${friendId}`);
    },
};
```

**File: `src/features/recommendation/services/recommendationApi.ts`**

```typescript
import api from "@/lib/axios";
import type { SuggestedUser, ConnectionStatus } from "../types/recommendation.types";

export const recommendationApi = {
    // Get friend suggestions
    getFriendSuggestions: async (params?: { context?: string; limit?: number }): Promise<{ suggestions: SuggestedUser[]; total: number }> => {
        const response = await api.get("/recommendations/friends", { params });
        return response.data;
    },

    // Dismiss suggestion
    dismissSuggestion: async (userId: string): Promise<void> => {
        await api.post(`/recommendations/friends/${userId}/dismiss`);
    },

    // Get connection status
    getConnectionStatus: async (
        username: string,
    ): Promise<{
        status: ConnectionStatus;
        requestId?: string;
    }> => {
        const response = await api.get(`/connections/status/${username}`);
        return response.data;
    },
};
```

---

## 5. UI COMPONENTS

### 5.1. FriendSuggestionCard Component

```typescript
// src/features/recommendation/components/FriendSuggestionCard.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import type { SuggestedUser } from '../types/recommendation.types';

interface FriendSuggestionCardProps {
  user: SuggestedUser;
  onConnect: (userId: string) => void;
  onDismiss: (userId: string) => void;
  isLoading?: boolean;
}

export function FriendSuggestionCard({
  user,
  onConnect,
  onDismiss,
  isLoading,
}: FriendSuggestionCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar */}
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
          </Avatar>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-lg">{user.displayName}</h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-1">{user.role}</p>
          </div>

          {/* Mutual friends */}
          {user.mutualFriends > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{user.mutualFriends} bạn chung</span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-600 line-clamp-2">{user.bio}</p>
          )}

          {/* Connection reason */}
          {user.connectionReason && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
              {getConnectionReasonLabel(user.connectionReason)}
            </span>
          )}

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              onClick={() => onConnect(user.id)}
              disabled={isLoading}
              className="flex-1"
            >
              Kết nối
            </Button>
            <Button
              onClick={() => onDismiss(user.id)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              Bỏ qua
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getConnectionReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    SAME_SCHOOL: 'Cùng trường',
    SAME_CLASS: 'Cùng lớp',
    SAME_SUBJECT: 'Cùng môn',
    MUTUAL_FRIENDS: 'Bạn chung',
    SIMILAR_INTERESTS: 'Sở thích chung',
  };
  return labels[reason] || reason;
}
```

### 5.2. ConnectionStatusButton Component

```typescript
// src/features/recommendation/components/ConnectionStatusButton.tsx
import { Button } from '@/components/ui/button';
import { Check, UserPlus, X, Loader2 } from 'lucide-react';
import type { ConnectionStatus } from '../types/recommendation.types';

interface ConnectionStatusButtonProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConnectionStatusButton({
  status,
  onConnect,
  onAccept,
  onReject,
  onCancel,
  isLoading,
}: ConnectionStatusButtonProps) {
  if (status === 'CONNECTED') {
    return (
      <Button variant="outline" disabled>
        <Check className="h-4 w-4 mr-2" />
        Bạn bè
      </Button>
    );
  }

  if (status === 'REQUEST_SENT') {
    return (
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <X className="h-4 w-4 mr-2" />
        )}
        Hủy yêu cầu
      </Button>
    );
  }

  if (status === 'REQUEST_RECEIVED') {
    return (
      <div className="flex gap-2">
        <Button onClick={onAccept} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Chấp nhận
        </Button>
        <Button
          variant="outline"
          onClick={onReject}
          disabled={isLoading}
        >
          Từ chối
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onConnect} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      Kết nối
    </Button>
  );
}
```

---

## 6. IMPLEMENTATION PLAN

### Phase 1: Setup & Basic Structure (2-3 ngày)

**Công việc:**

1. Tạo folder structure cho module recommendation
2. Setup types & schemas
3. Setup services (friendsApi - sử dụng endpoints có sẵn)
4. Tạo query keys trong `lib/query-keys.ts`

**Deliverables:**

- Folder structure hoàn chỉnh
- Type definitions
- friendsApi service
- Query keys

### Phase 2: Friends Management (3-4 ngày)

**Công việc:**

1. Implement hooks:
    - `useFriendRequests` - lấy incoming requests
    - `useFriendsList` - lấy danh sách bạn bè
    - `useConnectionActions` - accept, reject, cancel, unfriend

2. Implement components:
    - `FriendRequestCard` - card yêu cầu kết bạn
    - `FriendListItem` - item danh sách bạn bè
    - `ConnectionStatusButton` - button trạng thái

3. Implement pages:
    - `FriendRequestsPage` - trang yêu cầu kết bạn
    - `FriendsListPage` - trang danh sách bạn bè

**Deliverables:**

- Friend requests feature hoàn chỉnh
- Friends list feature hoàn chỉnh
- UI/UX theo design system

### Phase 3: Recommendation System (3-4 ngày)

**⚠️ Phụ thuộc Backend:** Cần BE implement recommendation endpoints

**Công việc:**

1. Implement recommendationApi service
2. Implement hooks:
    - `useFriendSuggestions` - lấy gợi ý kết nối
3. Implement components:
    - `FriendSuggestionCard` - card gợi ý
    - `RecommendationFilters` - filters (context, type)

4. Implement pages:
    - `RecommendationPage` - trang gợi ý kết nối

**Deliverables:**

- Recommendation feature hoàn chỉnh
- Filters & search
- Integration với Friends API

### Phase 4: Groups Feature (4-5 ngày)

**⚠️ Phụ thuộc Backend:** Cần BE implement groups endpoints

**Công việc:**

1. Implement groupsApi service
2. Implement hooks:
    - `useGroups` - CRUD groups
    - `useGroupMembers` - quản lý members

3. Implement components:
    - `GroupCard` - card nhóm
    - `GroupMemberItem` - item thành viên
4. Implement pages:
    - `GroupsPage` - danh sách nhóm
    - `GroupDetailPage` - chi tiết nhóm
    - `CreateGroupPage` - tạo nhóm

**Deliverables:**

- Groups feature hoàn chỉnh
- CRUD operations
- Member management

### Phase 5: Analytics (Optional - 2-3 ngày)

**Công việc:**

1. Network analytics dashboard
2. Visualization charts
3. Statistics

**Deliverables:**

- Analytics dashboard
- Charts & graphs

### Phase 6: Testing & Polish (2-3 ngày)

**Công việc:**

1. Unit tests cho hooks
2. Integration tests
3. UI/UX polish
4. Performance optimization
5. Error handling improvements

**Deliverables:**

- Test coverage > 80%
- Polished UI/UX
- Optimized performance

---

## 7. TESTING STRATEGY

### 7.1. Unit Tests

```typescript
// Example: useFriendRequests.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFriendRequests } from './useFriendRequests';

describe('useFriendRequests', () => {
  it('should fetch incoming requests', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useFriendRequests(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.requests).toBeDefined();
    expect(Array.isArray(result.current.requests)).toBe(true);
  });
});
```

### 7.2. Integration Tests

- Test full flow: Send request → Accept → Friends list
- Test full flow: Send request → Reject
- Test full flow: Send request → Cancel

### 7.3. E2E Tests (Optional)

- User journey: Xem gợi ý → Gửi yêu cầu → Chấp nhận → Xem bạn bè

---

## 8. PHỐI HỢP VỚI BACKEND

### 8.1. Endpoints cần Backend implement

**Priority 1 (Quan trọng):**

- `GET /recommendations/friends` - Gợi ý kết nối
- `GET /connections/status/{username}` - Trạng thái kết nối

**Priority 2 (Cần có):**

- `POST /recommendations/friends/{user_id}/dismiss` - Bỏ qua gợi ý
- All Groups endpoints

**Priority 3 (Tốt nếu có):**

- Analytics endpoints
- Advanced recommendation algorithms

### 8.2. API Contract

**Request format mẫu BE cần follow:**

```json
{
    "success": true,
    "data": {
        "suggestions": [
            {
                "id": "user-123",
                "username": "john_doe",
                "displayName": "John Doe",
                "avatar": "https://...",
                "role": "STUDENT",
                "bio": "Hello world",
                "school": "THPT ABC",
                "mutualFriends": 5,
                "connectionReason": "SAME_SCHOOL"
            }
        ],
        "total": 10
    }
}
```

### 8.3. Response error format

```json
{
    "success": false,
    "error": {
        "code": "FRIEND_REQUEST_EXISTS",
        "message": "Đã tồn tại yêu cầu kết bạn",
        "details": {}
    }
}
```

---

## 9. NOTES & BEST PRACTICES

### 9.1. State Management

- Sử dụng React Query cho server state
- Sử dụng Zustand cho client state (nếu cần)
- Không duplicate state

### 9.2. Performance

- Implement infinite scroll cho lists
- Lazy load images
- Debounce search inputs
- Cache API responses

### 9.3. Error Handling

- Hiển thị error messages user-friendly
- Retry failed requests
- Fallback UI cho errors

### 9.4. Accessibility

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management

---

## 10. RESOURCES

### 10.1. Documentation

- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### 10.2. API Documentation

- Backend Postman Collection: `social-be/postman_collection.json`
- Backend README: `social-be/README.md`

### 10.3. Design Reference

- Figma designs (nếu có)
- UI mockups (nếu có)

---

## 11. TIMELINE SUMMARY

| Phase                    | Duration       | Dependencies     |
| ------------------------ | -------------- | ---------------- |
| Phase 1: Setup           | 2-3 ngày       | None             |
| Phase 2: Friends         | 3-4 ngày       | Phase 1          |
| Phase 3: Recommendations | 3-4 ngày       | Phase 2 + BE API |
| Phase 4: Groups          | 4-5 ngày       | Phase 2 + BE API |
| Phase 5: Analytics       | 2-3 ngày       | Phase 3, 4       |
| Phase 6: Testing         | 2-3 ngày       | All phases       |
| **Total**                | **16-22 ngày** |                  |

---

## 12. CONTACT & SUPPORT

- **Backend Team:** Phối hợp implement API endpoints
- **Design Team:** Xác nhận UI/UX specs
- **QA Team:** Test plan & execution

---

**Người viết:** GitHub Copilot  
**Ngày:** 02/02/2026  
**Version:** 1.0
