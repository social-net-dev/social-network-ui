# Manual API Layer

## Cấu Trúc

```
src/lib/api/
├── services/           # API Services (sử dụng axios instance)
│   ├── auth.ts
│   ├── users.ts
│   ├── posts.ts
│   ├── comments.ts (trong posts.ts)
│   ├── reactions.ts
│   ├── shares.ts
│   ├── friends.ts
│   ├── notifications.ts
│   ├── profiles.ts
│   └── search.ts
├── types/               # TypeScript types
│   ├── common.types.ts
│   ├── auth.types.ts
│   ├── user.types.ts
│   ├── post.types.ts
│   ├── comment.types.ts
│   ├── reaction.types.ts
│   ├── share.types.ts
│   ├── friend.types.ts
│   └── notification.types.ts
├── hooks/               # Smart Hooks (React Query)
│   ├── useAuth.ts
│   ├── useUser.ts
│   ├── usePosts.ts
│   ├── useComments.ts
│   ├── useReactions.ts
│   ├── useShares.ts
│   ├── useFriends.ts
│   ├── useNotifications.ts
│   └── useSearch.ts
└── transforms/          # Transform BE -> FE
    ├── common.ts
    ├── userTransform.ts
    └── postTransform.ts
```

## Response Structure

Tất cả APIs đều trả về format:
```json
{
  "success": true,
  "data": { /* actual data */ },
  "request_id": "..."
}
```

Axios interceptor tự động unwrap và trả về `data` trực tiếp.

## Cách Sử Dụng

### 1. Smart Hooks (Khuyên dùng)

```typescript
import { useFeed, useAuth, useUser } from '@/lib/api/hooks';

// Feed
const { posts, isLoading, refetch } = useFeed({ page: 1, pageSize: 20 });

// Auth
const { login, register, isLoading } = useAuth();
await login({ email: '...', password: '...' });

// User
const { user } = useUser('me');
```

### 2. Direct API Services (Khi cần custom logic)

```typescript
import { authApi, usersApi } from '@/lib/api/services';

// Direct call
const user = await usersApi.getMe();
```

## Endpoints Mapping

| Feature | Endpoints | Hook | Service |
|---------|-----------|------|---------|
| Auth | 6 | `useAuth` | `authApi` |
| Users | 7 | `useUser`, `useUserActions` | `usersApi` |
| Posts | 7 | `useFeed`, `usePosts`, `usePost`, `usePostActions` | `postsApi` |
| Comments | 6 | `useComments`, `useCommentActions` | `postsApi` |
| Reactions | 4 | `useReactions` | `reactionsApi` |
| Shares | 2 | `useShares` | `sharesApi` |
| Friends | 9 | `useFriends`, `useFriendActions` | `friendsApi` |
| Notifications | 5 | `useNotifications`, `useNotificationActions` | `notificationsApi` |
| Profiles | 1 | `useUser` | `profilesApi` |
| Search | 1 | `useSearchUsers` | `searchApi` |

## Backend URL

- **Development**: `http://localhost:8001/api`
- **Production**: `/api` (via Caddy proxy)

## Authentication

Token được tự động thêm vào Authorization header:
```
Authorization: Bearer <access_token>
```

Tenant slug được thêm vào X-Tenant-Slug header:
```
X-Tenant-Slug: <tenant_slug>
```

Refresh token flow được xử lý tự động khi nhận 401.
