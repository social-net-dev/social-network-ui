# AGENTS.md — Hướng dẫn cho AI Agents & Contributors

Tài liệu này mô tả kiến trúc, quy ước, và các quyết định thiết kế quan trọng của dự án. Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.

---

## Mô hình làm việc: Contract-First

Đây là nguyên tắc cốt lõi của toàn bộ codebase:

```
contract/main.tsp
        ↓  pnpm gen:spec
tsp-output/schema/openapi.json     (tham khảo)
        ↓  viết tay dựa trên contract
src/lib/api/types/                 # TypeScript types thủ công
src/lib/api/endpoints/             # Pure async functions
src/lib/api/hooks/                 # React Query hooks
        ↓  import
src/features/*/hooks/ → src/features/*/components/
```

1. **Nguồn sự thật duy nhất** là `contract/main.tsp` (nằm trong cùng project)
2. **Không bao giờ** sửa tay các file trong `tsp-output/`
3. Khi cần thêm field, endpoint, hay type mới → **sửa `contract/main.tsp` trước**, sau đó cập nhật thủ công `src/lib/api/types/`, `src/lib/api/endpoints/`, `src/lib/api/hooks/`

### Pipeline tái sinh OpenAPI spec (nếu cần)

```bash
# Chỉ gen OpenAPI spec từ TypeSpec (không gen TS code nữa)
pnpm gen:spec   # contract/main.tsp → tsp-output/schema/openapi.json
```

---

## Cấu trúc API Client (Hand-Written)

```
src/lib/api/
├── types/                  # TypeScript types thủ công từ contract
│   ├── common.ts           # ApiError, PaginatedResponse, CursorPaginatedResponse, Enums
│   ├── auth.ts             # LoginRequest, LoginResponse, RegisterRequest…
│   ├── user.ts             # Author, UserBase, UserPublic, UserMe, User, UserPrivacy…
│   ├── post.ts             # PostSummary, Post, FeedResponse, CreatePostRequest…
│   ├── comment.ts          # Comment, CommentResponse, CreateCommentRequest…
│   ├── media.ts            # MediaAsset, PresignedUploadInitRequest…
│   ├── reaction.ts         # ReactRequest, PostReaction, CommentReaction
│   ├── friend.ts           # Friend, FriendRequest, FriendshipStatus…
│   ├── notification.ts     # Notification, NotificationListResponse…
│   ├── search.ts           # SearchUsersResponse, ApiSuggestion…
│   └── index.ts            # Re-export barrel
├── endpoints/              # Pure async functions per domain
│   ├── auth.ts             # authLogin, authRegister, authLogout…
│   ├── users.ts            # usersGetMe, usersUpdateProfile…
│   ├── feed.ts             # feedGetFeed + getFeedGetFeedQueryKey
│   ├── posts.ts            # postsGetPost, postsCreatePost… + query key factories
│   ├── comments.ts         # commentsCreateComment, commentsDeleteComment…
│   ├── reactions.ts        # reactionsReactToPost, reactionsUnreactPost…
│   ├── shares.ts           # sharesSharePost, sharesUnsharePost
│   ├── friends.ts          # friendsListFriends, friendsSendRequest…
│   ├── follows.ts          # followsFollowUser, followsGetFollowers…
│   ├── notifications.ts    # notificationsListNotifications…
│   ├── profiles.ts         # profilesGetProfile
│   ├── media.ts            # mediaInitUpload, mediaCompleteUpload…
│   ├── search.ts           # searchSearchUsers
│   ├── recommendations.ts  # recommendationsSuggestions
│   └── index.ts            # Re-export barrel
├── hooks/                  # React Query hooks per domain
│   ├── auth.hooks.ts       # useAuthLogin, useAuthRegister…
│   ├── users.hooks.ts      # useUsersGetMe, useUsersUpdateProfile…
│   ├── feed.hooks.ts       # useFeedGetFeed (infinite query)
│   ├── posts.hooks.ts      # usePostsGetPost, usePostsCreatePost…
│   ├── comments.hooks.ts   # useCommentsCreateComment…
│   ├── reactions.hooks.ts  # useReactionsReactToPost…
│   ├── shares.hooks.ts     # useSharesSharePost
│   ├── friends.hooks.ts    # useFriendsListFriends, useFriendsSendRequest…
│   ├── follows.hooks.ts    # useFollowsFollowUser
│   ├── notifications.hooks.ts  # useNotificationsListNotifications…
│   ├── profiles.hooks.ts   # useProfilesGetProfile
│   ├── media.hooks.ts      # useMediaInitUpload, useMediaCompleteUpload…
│   ├── search.hooks.ts     # useSearchSearchUsers, useRecommendationsSuggestions
│   └── index.ts            # Re-export barrel
├── createApiClient.ts      # Tạo Axios instance
├── attachRequestInterceptor.ts  # Inject auth token + X-Tenant-Slug
├── attachResponseInterceptor.ts # Unwrap ApiResponse envelope + token refresh
├── authRequestGuards.ts    # Helper: public vs protected routes
├── zodValidation.ts        # Zod validation helpers
└── utils.ts                # extractUserIdFromTenantSlug, v.v.
```

Mỗi domain có pattern nhất quán:
- `useXxxYyy(...)` — React Query hook (query), nhận `UseQueryOptions` override
- `useXxxYyy(...)` — React Query mutation hook, nhận `UseMutationOptions` override
- `xxxYyy(...)` — hàm async thuần trả về `Promise<T>` (fully unwrapped)
- `getXxxYyyQueryKey(...)` — lấy query key (defined trong endpoints, re-exported từ hooks)

---

## Quy tắc Import Types

### ✅ Đúng
```ts
import type { PostSummary, User, Author, FeedResponse } from '@/lib/api/types';
```

### ✅ Đúng — import hooks
```ts
import { usePostsCreatePost, usePostsGetPost } from '@/lib/api/hooks/posts.hooks';
import { feedGetFeed, getFeedGetFeedQueryKey } from '@/lib/api/endpoints/feed';
```

### ❌ Sai — không bao giờ làm
```ts
// Định nghĩa lại type đã có trong contract
interface Post {
  id: string;
  author: { ... };
}
```

### Khi cần extend type
Chỉ extend khi có field thực sự thuần frontend (không nên có trong contract):
```ts
// ✅ OK — sharedPost là field frontend-only
type PostWithShared = PostSummary & { sharedPost?: PostSummary | null };

// ✅ OK — extend Author cho legacy fields
type Author = GeneratedAuthor & { firstName?: string; lastName?: string };
```

---

## Cấu trúc Response API

### Envelope chuẩn
Mọi response API đều được unwrap tự động bởi `attachResponseInterceptor.ts`:
```ts
// Server trả về:
{ success: true, data: T, request_id: string }

// Sau unwrap, endpoint functions nhận được T trực tiếp:
const feedResponse = await feedGetFeed(params);
// feedResponse = FeedResponse = { items: PostSummary[], pagination: CursorPaginationMeta }
```

### Pagination chuẩn
Tất cả paginated responses dùng cấu trúc `PaginatedResponse<T>`:
```ts
{
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  }
}
```

**Không dùng** các field cũ: `posts`, `total_pages` trực tiếp trên root, `page` trực tiếp trên root.

---

## Key Hooks

### Feed
```ts
// src/features/home/hooks/useFeed.ts
const { posts, queryKey, isLoading, fetchNextPage, hasNextPage, createPost } = useFeed({ fieldId, postType });
// posts là PostSummary[]
```

### Comments
```ts
// src/features/home/hooks/useComments.ts
const { comments, addComment, deleteComment, reactToComment, updateComment, replyToComment } = useComments(postId);
// comments là FeedComment[] (= Comment & { author: Author })
```

### Post Actions (optimistic update)
```ts
// src/features/home/hooks/usePostActions.ts
const { deletePost, updatePost, sharePost, likePost } = usePostActions({ affectedQueryKeys: [queryKey] });
// Tự động update cache optimistic trên tất cả queryKeys được truyền vào
```

### Profile
```ts
// src/features/profile/hooks/useProfile.ts
const { profile, isMe, updateProfile, updatePrivacy, uploadAvatar, uploadBackground } = useProfile();
// profile là User | undefined (từ /users/me hoặc /profiles/:username)
```

### User Posts
```ts
// src/features/profile/hooks/useProfilePosts.ts
const { posts, query, queryKey } = useProfilePosts({ mode: 'me' | 'other', subjectUserId });
// posts là PostSummary[]
```

---

## Components Quan Trọng

### PostCard
```tsx
// Nhận PostSummary trực tiếp — không cần convert sang FeedPost
<PostCard post={postSummary} onLike={...} onComment={...} onShare={...} />
```
Type nội bộ: `PostWithShared = PostSummary & { sharedPost?: PostSummary | null }`

### Avatar
```tsx
// Chấp nhận AvatarUser: { id?, displayName?, username?, avatar?, avatar_path?, name? }
<Avatar user={author} size="md" />
```
Tự động resolve URL từ `avatar_path` (R2 key) hoặc `avatar` (absolute URL).

### FeedList
```tsx
// Nhận PostWithShared[] (compatible với PostSummary[])
<FeedList posts={posts} isLoading={...} onLike={...} onComment={...} onShare={...} />
```

---

## State Management

### Auth Store (`src/stores/authStore.ts`)
```ts
const { user, isAuthenticated, login, logout, getUserId } = useAuthStore();
// user là User | null (kiểu từ generated model)
```

### E2EE Store (`src/stores/e2eeStore.ts`)
```ts
const { keyPair, initialize } = useE2EEStore();
// Quản lý CryptoKeyPair cho E2EE messaging
```

---

## Privacy System

`UserPrivacy` trong contract dùng `overrides[]` (không phải flat fields):
```ts
interface UserPrivacy {
  default_visibility: Visibility;        // 'PUBLIC' | 'FRIENDS' | 'PRIVATE'
  overrides?: PrivacyOverride[];         // [{ field: 'bio', visibility: 'PRIVATE' }]
}
```

Helper `privacyToFlatSettings()` trong `ProfileSettingsPage.tsx` convert sang flat map cho UI:
```ts
function privacyToFlatSettings(privacy: UserPrivacy): Record<string, string>
// → { bio_visibility: 'PRIVATE', avatar_visibility: 'PUBLIC', ... }
```

`PrivacyField` enum: `display_name | birth_date | bio | avatar | background | personal_info`

---

## Media Upload Flow

```
1. POST /media/uploads/init      → upload_id, asset_id, upload_url (presigned)
2. PUT/POST {upload_url}         → upload file thẳng lên R2/S3
3. POST /media/uploads/{id}/complete → confirm upload
4. Dùng asset_id trong payload tạo post/avatar/...
```

Helper: `uploadMediaAsset(file, purpose)` tại `src/features/posts/lib/uploadMediaAsset.ts`

---

## E2EE Messaging

- Key pair sinh khi user lần đầu mở trang Messages
- Private key encrypt với passphrase → backup lên server
- Restore: lấy backup từ server + decrypt bằng passphrase
- **Không persist passphrase** trên device
- Public key lưu trên server, dùng để encrypt message gửi đến

---

## Các Cast Được Chấp Nhận

Một số `as unknown as` là không thể tránh:

| Vị trí | Lý do |
|--------|-------|
| Query key casts `as unknown as readonly unknown[]` | Orval sinh `DataTag<QueryKey, T>` — không assign được sang `readonly unknown[]` |
| `attachResponseInterceptor.ts` config cast | Axios internal type không export `skipUnwrap` field |
| `useComments.ts` `query.data as FeedComment[]` | TypeScript không narrow sau `select` trong trường hợp này |

---

## Những Thứ Đã Bị Xóa (Không Dùng Lại)

| Thứ bị xóa | Thay thế bằng |
|------------|---------------|
| `src/lib/api/transforms/` | Không cần — dùng types trực tiếp |
| `src/lib/api/services/` | Hooks trong `src/lib/api/hooks/` |
| `src/lib/api/generated/` | `src/lib/api/types/` + `src/lib/api/endpoints/` + `src/lib/api/hooks/` |
| `src/lib/query-keys.ts` | `getXxxQueryKey()` trong endpoints |
| `src/lib/utils/userTransform.ts` | `useProfile` select trực tiếp |
| `toFeedPost()` adapter | `PostCard` nhận `PostSummary` trực tiếp |
| `IBackendPost`, `IBackendAuthor`… | Không dùng — typed qua contract |
| Orval-generated wrapper types (`AuthLogin200`, `FeedGetFeed200`…) | Dùng trực tiếp: `LoginResponse`, `FeedResponse`… |

---

## Checklist Trước Khi Commit

- [ ] `pnpm tsc --noEmit` — 0 errors
- [ ] Không có type định nghĩa lại từ `@/lib/api/types`
- [ ] Không có Axios call thủ công (ngoài `customInstance` đặc biệt)
- [ ] Nếu sửa TypeSpec → đã chạy `gen:spec`, sau đó cập nhật tay `types/`, `endpoints/`, `hooks/` tương ứng
- [ ] Pagination dùng `items` + `pagination.page/total_pages` (không dùng field cũ)
- [ ] `pnpm lint` — không có error

---

## Quy ước Đặt Tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Query hook | `useXxxYyy` | `useFeedGetFeed`, `usePostsGetPost` |
| Mutation hook | `useXxxYyy` | `usePostsCreatePost`, `useAuthLogin` |
| Raw endpoint fn | `xxxYyy` | `feedGetFeed`, `postsCreatePost` |
| Query key factory | `getXxxYyyQueryKey` | `getFeedGetFeedQueryKey`, `getPostsGetPostQueryKey` |
| Custom hook | `useXxx` (camelCase) | `useFeed`, `useProfile`, `useComments` |
| Component | PascalCase | `PostCard`, `FeedList`, `Avatar` |
| Feature page | PascalCase + Page | `FeedPage`, `ProfilePage` |
| Type từ contract | PascalCase | `PostSummary`, `User`, `Author` |
| Store | camelCase + Store | `authStore`, `e2eeStore` |

---

*Cập nhật lần cuối: Tháng 3, 2026*
