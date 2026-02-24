# AGENTS.md — Hướng dẫn cho AI Agents & Contributors

Tài liệu này mô tả kiến trúc, quy ước, và các quyết định thiết kế quan trọng của dự án. Đọc kỹ trước khi thực hiện bất kỳ thay đổi nào.

---

## Mô hình làm việc: Contract-First

Đây là nguyên tắc cốt lõi của toàn bộ codebase:

```
contract/main.tsp
        ↓  pnpm gen:spec
tsp-output/schema/openapi.json
        ↓  pnpm gen:api
src/lib/api/generated/
        ↓  import
src/features/*/hooks/ → src/features/*/components/
```

1. **Nguồn sự thật duy nhất** là `contract/main.tsp` (nằm trong cùng project)
2. **Không bao giờ** sửa tay các file trong `src/lib/api/generated/` hay `tsp-output/`
3. Khi cần thêm field, endpoint, hay type mới → **sửa `contract/main.tsp` trước**, sau đó chạy lại pipeline

### Pipeline tái sinh

```bash
# Chạy toàn bộ pipeline trong một lệnh (khuyến dùng)
pnpm gen

# Hoặc từng bước:
pnpm gen:spec   # contract/main.tsp → tsp-output/schema/openapi.json
pnpm gen:api    # openapi.json → src/lib/api/generated/
```

---

## Cấu trúc Generated Client

```
src/lib/api/generated/
├── model/              # Tất cả TypeScript types (PostSummary, User, Author…)
│   └── index.ts        # Re-export tập trung
├── feed/               # Feed hooks
├── posts/              # Posts hooks
├── users/              # Users hooks
├── profiles/           # Profiles hooks
├── comments/           # Comments hooks
├── reactions/          # Reactions hooks
├── friends/            # Friends hooks
├── notifications/      # Notifications hooks
├── media/              # Media hooks
├── auth/               # Auth hooks
├── shares/             # Shares hooks
├── search/             # Search hooks
└── admin/              # Admin hooks
```

Mỗi domain có pattern nhất quán:
- `useXxxYyy(...)` — React Query hook (query)
- `useXxxYyyMutation(...)` — React Query mutation hook
- `xxxYyy(...)` — hàm async thuần (dùng trong `queryFn` custom)
- `getXxxYyyQueryKey(...)` — lấy query key

---

## Quy tắc Import Types

### ✅ Đúng
```ts
import type { PostSummary, User, Author, FeedResponse } from '@/lib/api/generated/model';
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

// Sau unwrap, hooks nhận được:
{ data: T }   ← resp.data === T trực tiếp (không phải resp.data.data)
```

> **Exception**: `skipUnwrap` flag tắt unwrap cho một số endpoint đặc biệt.

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
| `src/lib/api/transforms/` | Không cần — dùng generated types trực tiếp |
| `src/lib/api/services/` | Generated hooks trong `src/lib/api/generated/` |
| `src/lib/api/hooks/` (manual) | Generated hooks |
| `src/lib/api/types/` (manual) | `src/lib/api/generated/model/` |
| `src/lib/query-keys.ts` | `getXxxQueryKey()` từ Orval |
| `src/lib/utils/userTransform.ts` | `useProfile` select trực tiếp |
| `toFeedPost()` adapter | `PostCard` nhận `PostSummary` trực tiếp |
| `IBackendPost`, `IBackendAuthor`… | Không dùng — typed qua contract |

---

## Checklist Trước Khi Commit

- [ ] `pnpm tsc --noEmit` — 0 errors
- [ ] Không có type định nghĩa lại từ generated model
- [ ] Không có Axios call thủ công (ngoài `customInstance` đặc biệt)
- [ ] Nếu sửa TypeSpec → đã chạy lại `gen:spec` + `orval`
- [ ] Pagination dùng `items` + `pagination.page/total_pages` (không dùng field cũ)
- [ ] `pnpm lint` — không có error

---

## Quy ước Đặt Tên

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Generated query hook | `useXxxYyy` | `useFeedGetFeed`, `usePostsGetPost` |
| Generated mutation hook | `useXxxYyy` | `usePostsCreatePost`, `useAuthLogin` |
| Custom hook | `useXxx` (camelCase) | `useFeed`, `useProfile`, `useComments` |
| Component | PascalCase | `PostCard`, `FeedList`, `Avatar` |
| Feature page | PascalCase + Page | `FeedPage`, `ProfilePage` |
| Type từ contract | PascalCase | `PostSummary`, `User`, `Author` |
| Store | camelCase + Store | `authStore`, `e2eeStore` |

---

*Cập nhật lần cuối: Tháng 2, 2026*
