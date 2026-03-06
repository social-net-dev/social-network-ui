# AGENTS.md — Hướng dẫn cho AI Agents & Contributors

Tài liệu này mô tả kiến trúc, quy ước, và các quyết định thiết kế quan trọng của dự án. Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.

---

## Mô hình làm việc: Contract-First + Orval Auto-Generation

Đây là nguyên tắc cốt lõi của toàn bộ codebase:

```
contract/main.tsp
        ↓  pnpm gen:spec
tsp-output/schema/openapi.json         # Có envelope ApiResponse<T> — dùng cho Scalar/Swagger docs
        ↓  pnpm gen:clean  (scripts/transform-openapi.ts)
tsp-output/schema/openapi.clean.json  # Envelope stripped — dùng cho Orval code gen
        ↓  pnpm gen:hooks  (Orval)
src/lib/api/generated/                 # AUTO-GENERATED — KHÔNG sửa tay
  ├── model/                           # Tất cả TypeScript types từ contract
  └── {domain}/                        # Endpoint functions + React Query hooks per domain
src/lib/api/types/index.ts            # Re-export từ generated/model + frontend-only generics
        ↓  import
src/features/*/hooks/ → src/features/*/components/
```

1. **Nguồn sự thật duy nhất** là `contract/main.tsp`
2. **Không bao giờ** sửa tay `tsp-output/` hay `src/lib/api/generated/`
3. Khi cần thêm field, endpoint, hay type mới → **sửa `contract/main.tsp` trước**, sau đó chạy lại pipeline
4. **Tại sao cần `gen:clean`?** TypeSpec wrap responses trong `ApiResponse<T>` envelope, nhưng `attachResponseInterceptor.ts` đã unwrap tại runtime. Script transform-openapi.ts strip envelope để Orval generate đúng types.

### Pipeline tái sinh

```bash
# Chạy toàn bộ pipeline trong một lệnh (khuyến dùng)
pnpm gen

# Hoặc từng bước:
pnpm gen:spec   # contract/main.tsp → tsp-output/schema/openapi.json
pnpm gen:clean  # openapi.json → openapi.clean.json (strip ApiResponse envelope)
pnpm gen:hooks  # openapi.clean.json → src/lib/api/generated/ (Orval)
```

---

## Cấu trúc API Client

```
src/lib/api/
├── generated/                  # AUTO-GENERATED bởi Orval — KHÔNG sửa tay
│   ├── model/                  # Tất cả TypeScript types từ contract (~100 types)
│   ├── auth/auth.ts            # authLogin, authRegister… + useAuthLogin, useAuthRegister…
│   ├── users/users.ts          # usersGetMe… + useUsersGetMe…
│   ├── feed/feed.ts            # feedGetFeed + useFeedGetFeed (infinite)
│   ├── posts/posts.ts          # postsGetPost, postsCreatePost… + hooks
│   ├── comments/comments.ts    # commentsCreateComment… + hooks
│   ├── reactions/reactions.ts  # reactionsReactToPost… + hooks
│   ├── shares/shares.ts        # sharesSharePost… + hooks
│   ├── friends/friends.ts      # friendsListFriends… + hooks
│   ├── follows/follows.ts      # followsGetFollowers… + hooks (infinite)
│   ├── notifications/notifications.ts  # notificationsListNotifications… + hooks (infinite)
│   ├── profiles/profiles.ts    # profilesGetProfile… + hooks
│   ├── media/media.ts          # mediaInitUpload, mediaCompleteUpload… + hooks
│   ├── search/search.ts        # searchSearchUsers… + hooks
│   ├── recommendations/recommendations.ts  # recommendationsSuggestions… + hooks
│   └── index.ts                # Re-export barrel (import từ đây)
├── types/
│   └── index.ts                # Re-export từ generated/model + frontend-only generics
├── createApiClient.ts          # Tạo Axios instance
├── attachRequestInterceptor.ts # Inject auth token + X-Tenant-Slug
├── attachResponseInterceptor.ts # Unwrap ApiResponse envelope + token refresh
├── authRequestGuards.ts        # Helper: public vs protected routes
├── zodValidation.ts            # Zod validation helpers
└── utils.ts                    # extractUserIdFromTenantSlug, v.v.
```

Mỗi domain có pattern nhất quán (Orval-generated):
- `xxxYyy(body, options?, signal?)` — hàm async thuần trả về `Promise<T>`
- `useXxxYyy(params?, options?)` — React Query hook, `options = { query?: QueryOptions, request?: CustomInstanceOptions }`
- `useXxxYyy(options?)` — React Query mutation hook, `options = { mutation?: MutationOptions, request?: CustomInstanceOptions }`
- `getXxxYyyQueryKey(params?)` — lấy query key

**Quan trọng — Orval mutation variables**: Body params được wrap trong `{ data: T }`:
```ts
// Mutation variable structure: { data: ChangePasswordRequest }
const { mutate } = useAuthChangePassword();
mutate({ data: { current_password: '...', new_password: '...' } });
```

**Quan trọng — Query/Mutation options**: Phải wrap trong đúng key:
```ts
// Query options → trong `query: { ... }`
useXxx(params, { query: { enabled: !!id, staleTime: 60000 } });

// Mutation callbacks → trong `mutation: { ... }`
useXxx({ mutation: { onSuccess: (res) => ..., onError: (err: ApiErrorResponse) => ... } });
```

---

## Quy tắc Import Types

### ✅ Đúng — import types
```ts
import type { PostSummary, User, Author, FeedResponse } from '@/lib/api/types';
```

### ✅ Đúng — import hooks & endpoints
```ts
import { usePostsCreatePost, usePostsGetPost, feedGetFeed, getFeedGetFeedQueryKey } from '@/lib/api/generated';
```

### ❌ Sai — không bao giờ làm
```ts
// Đường dẫn cũ đã bị xóa
import { usePostsGetPost } from '@/lib/api/hooks/posts.hooks';  // ❌ không tồn tại
import { feedGetFeed } from '@/lib/api/endpoints/feed';          // ❌ không tồn tại

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
| `src/lib/api/services/` | Hooks trong `src/lib/api/generated/` |
| `src/lib/api/endpoints/` (14 files) | `src/lib/api/generated/{domain}/{domain}.ts` |
| `src/lib/api/hooks/` (15 files) | `src/lib/api/generated/{domain}/{domain}.ts` |
| `src/lib/api/types/schema.d.ts` | `src/lib/api/generated/model/` |
| `src/lib/api/types/auth.types.ts` | Generated types trong `src/lib/api/generated/model/` |
| `src/lib/query-keys.ts` | `getXxxQueryKey()` factories trong generated files |
| `src/lib/utils/userTransform.ts` | `useProfile` select trực tiếp |
| `toFeedPost()` adapter | `PostCard` nhận `PostSummary` trực tiếp |
| `IBackendPost`, `IBackendAuthor`… | Không dùng — typed qua contract |
| `openapi-typescript` devDep + `gen:types` script | Orval generates models trực tiếp |

---

## Checklist Trước Khi Commit

- [ ] `pnpm typecheck` — 0 errors (`tsc -p tsconfig.app.json --noEmit`)
- [ ] Không có type định nghĩa lại từ `@/lib/api/types`
- [ ] Không có Axios call thủ công (ngoài `customInstance` đặc biệt)
- [ ] Không import từ `@/lib/api/hooks/*` hay `@/lib/api/endpoints/*` (đã bị xóa)
- [ ] Nếu sửa TypeSpec → đã chạy `pnpm gen` (`gen:spec` + `gen:clean` + `gen:hooks`)
- [ ] Pagination cursor-based dùng `items` + `pagination.cursor` (không dùng page-based fields)
- [ ] `pnpm lint` — không có error mới

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
