# Hướng dẫn luồng: Contract → Code Generation

Tài liệu này mô tả toàn bộ luồng từ định nghĩa contract TypeSpec đến các React Query hooks sẵn sàng dùng trong component.

---

## Tổng quan kiến trúc

```
contract/main.tsp
        │
        │  pnpm gen:spec
        ▼
tsp-output/schema/openapi.json          ← spec đầy đủ (có ApiResponse<T> envelope)
        │                                  dùng để render Swagger / Scalar docs
        │  pnpm gen:clean
        ▼
tsp-output/schema/openapi.clean.json    ← envelope đã bị strip
        │                                  dùng cho Orval code generation
        │  pnpm gen:hooks
        ▼
src/lib/api/generated/
  ├── model/           ← tất cả TypeScript types từ contract
  └── {domain}/        ← endpoint functions + React Query hooks mỗi domain
        │
        │  import
        ▼
src/features/*/hooks/ → src/features/*/components/
```

---

## Bước 1 — Định nghĩa contract (`contract/main.tsp`)

`contract/main.tsp` là **nguồn sự thật duy nhất** (single source of truth) của toàn bộ API.

### Cấu trúc file

```typespec
import "@typespec/http";
import "@typespec/openapi";
import "@typespec/versioning";

namespace SocialNetwork {
  // Envelope chuẩn — tất cả success response đều wrap trong đây
  model ApiResponse<T> {
    success: true;
    data: T;
    request_id?: string;
  }

  // Định nghĩa models
  model Post {
    id: string;
    content: string;
    author: Author;
    created_at: utcDateTime;
  }

  // Định nghĩa endpoints
  @route("/posts")
  interface Posts {
    @get list(...PaginationParams): OkEnvelopeResponse<PostListResponse>;
    @post create(@body body: CreatePostRequest): CreatedEnvelopeResponse<PostSummary>;
  }
}
```

### Nguyên tắc khi sửa contract

- Thêm field mới vào model → sửa trong `main.tsp`
- Thêm endpoint mới → sửa trong `main.tsp`
- Đổi tên field → sửa trong `main.tsp`
- **Không bao giờ** sửa tay files trong `tsp-output/` hay `src/lib/api/generated/`

---

## Bước 2 — Compile TypeSpec thành OpenAPI (`gen:spec`)

```bash
pnpm gen:spec
# Chạy: tsp compile ./contract
# Output: tsp-output/schema/openapi.json
```

TypeSpec compiler đọc `contract/main.tsp` và sinh ra `openapi.json` chuẩn OpenAPI 3.0.

**Lưu ý:** File này có `ApiResponse<T>` envelope bao quanh tất cả success responses:

```json
// openapi.json — response schema vẫn còn envelope
{
  "200": {
    "content": {
      "application/json": {
        "schema": {
          "type": "object",
          "required": ["success", "data"],
          "properties": {
            "success": { "type": "boolean", "enum": [true] },
            "data": { "$ref": "#/components/schemas/PostSummary" },
            "request_id": { "type": "string" }
          }
        }
      }
    }
  }
}
```

File này dùng để render **Swagger UI / Scalar docs** trên Cloudflare Worker (`worker/src/index.ts`).

---

## Bước 3 — Strip envelope (`gen:clean`)

```bash
pnpm gen:clean
# Chạy: tsx scripts/transform-openapi.ts
# Input:  tsp-output/schema/openapi.json
# Output: tsp-output/schema/openapi.clean.json
```

### Tại sao cần bước này?

`attachResponseInterceptor.ts` đã tự động **unwrap** `ApiResponse<T>` envelope tại runtime:

```
Server trả về:     { success: true, data: PostSummary, request_id: "..." }
                          ↓ attachResponseInterceptor unwrap
Hook/function nhận: PostSummary
```

Nếu để Orval generate từ spec gốc, nó sẽ sinh types với envelope — không khớp với data thực tế mà hook nhận được.

`scripts/transform-openapi.ts` đọc spec gốc, phát hiện pattern `ApiResponse<T>` và thay thế bằng `T` trực tiếp:

```json
// openapi.clean.json — envelope đã strip
{
  "200": {
    "content": {
      "application/json": {
        "schema": { "$ref": "#/components/schemas/PostSummary" }
      }
    }
  }
}
```

---

## Bước 4 — Generate hooks (`gen:hooks`)

```bash
pnpm gen:hooks
# Chạy: orval --config orval.config.ts
# Input:  tsp-output/schema/openapi.clean.json
# Output: src/lib/api/generated/
```

Orval đọc `openapi.clean.json` và sinh ra:

### `src/lib/api/generated/model/`
Tất cả TypeScript interfaces/types từ contract:
```ts
// src/lib/api/generated/model/postSummary.ts (auto-generated)
export interface PostSummary {
  id: string;
  content: string;
  author: Author;
  created_at: string;
  // ...
}
```

### `src/lib/api/generated/{domain}/{domain}.ts`
Mỗi domain có 3 loại export:

```ts
// 1. Endpoint function thuần (Promise-based)
export const postsCreatePost = (
  createPostRequest: CreatePostRequest,
  options?: AxiosRequestConfig,
): Promise<PostSummary> => {
  return customInstance({ url: '/posts', method: 'POST', data: createPostRequest }, options);
};

// 2. Query hook (GET endpoints)
export const usePostsGetPost = (
  postId: string,
  options?: { query?: UseQueryOptions<PostSummary>; request?: AxiosRequestConfig }
): UseQueryResult<PostSummary> => { ... };

// 3. Mutation hook (POST/PUT/DELETE endpoints)
export const usePostsCreatePost = (
  options?: { mutation?: UseMutationOptions<PostSummary, ApiErrorResponse, { data: CreatePostRequest }>; request?: AxiosRequestConfig }
): UseMutationResult<...> => { ... };

// 4. Query key factory
export const getPostsGetPostQueryKey = (postId: string) => ['posts', postId] as const;
```

### `src/lib/api/generated/index.ts`
Re-export barrel — import mọi thứ từ đây:
```ts
import { usePostsCreatePost, postsGetPost, getPostsGetPostQueryKey } from '@/lib/api/generated';
```

---

## Chạy toàn bộ pipeline

```bash
# Cách khuyến dùng — chạy cả 3 bước liên tiếp
pnpm gen

# Hoặc từng bước khi debug
pnpm gen:spec    # contract → openapi.json
pnpm gen:clean   # openapi.json → openapi.clean.json
pnpm gen:hooks   # openapi.clean.json → src/lib/api/generated/
```

### Watch mode (khi đang sửa contract)
```bash
pnpm gen:spec:watch  # TypeSpec tự recompile khi main.tsp thay đổi
# Sau đó chạy thủ công gen:clean + gen:hooks
```

---

## Sử dụng generated code

### Import types
```ts
// ✅ Luôn import từ đây
import type { PostSummary, User, Author, CreatePostRequest } from '@/lib/api/types';
// (re-export từ src/lib/api/generated/model/)

// ❌ Không tự định nghĩa lại type đã có trong contract
interface Post { id: string; author: { ... } }
```

### Import hooks và functions
```ts
// ✅ Luôn import từ generated barrel
import { usePostsCreatePost, postsGetPost, getPostsGetPostQueryKey } from '@/lib/api/generated';

// ❌ Không import từ đường dẫn cũ (đã bị xóa)
import { usePostsGetPost } from '@/lib/api/hooks/posts.hooks';   // ❌
import { postsGetPost } from '@/lib/api/endpoints/posts';         // ❌
```

### Dùng query hook
```ts
const { data: post, isLoading } = usePostsGetPost(postId, {
  query: {
    enabled: !!postId,
    staleTime: 60_000,
  },
});
```

### Dùng mutation hook
```ts
// Body params được Orval wrap trong { data: T }
const { mutate: createPost } = usePostsCreatePost({
  mutation: {
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: getFeedGetFeedQueryKey() });
    },
    onError: (err: ApiErrorResponse) => {
      toast.error(err.error.message);
    },
  },
});

// Gọi mutation
createPost({ data: { content: 'Hello world', media_ids: [] } });
```

### Dùng infinite query hook (cursor-based pagination)
```ts
const { data, fetchNextPage, hasNextPage } = useFeedGetFeed(
  { page_size: 10 },
  {
    query: {
      getNextPageParam: (lastPage) => lastPage.pagination.next_cursor ?? undefined,
    },
  },
);

// Flatten pages
const posts = data?.pages.flatMap((page) => page.items) ?? [];
```

---

## Cấu hình Orval (`orval.config.ts`)

### Infinite query endpoints
Chỉ endpoints có field `cursor` trong params mới được cấu hình `useInfinite: true`:

```ts
// orval.config.ts
operations: {
  Feed_getFeed: {
    query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
  },
  Follows_getFollowers: {
    query: { useInfinite: true, useInfiniteQueryParam: 'cursor' },
  },
  // ... thêm ở đây khi thêm endpoint cursor-based mới
}
```

### Custom mutator
Tất cả generated code dùng `customInstance` từ `src/lib/api.ts`:
- Tự động inject `Authorization` header + `X-Tenant-Slug`
- Tự động unwrap `ApiResponse<T>` envelope
- Tự động refresh token khi nhận `401`

---

## Checklist khi thêm tính năng mới

1. **Sửa `contract/main.tsp`** — thêm model hoặc endpoint
2. **Chạy `pnpm gen`** — regenerate toàn bộ
3. **Kiểm tra `src/lib/api/generated/`** — verify types và hooks mới được sinh đúng
4. **Import và dùng** từ `@/lib/api/generated` và `@/lib/api/types`
5. **Chạy `pnpm typecheck`** — đảm bảo 0 TypeScript errors
6. Nếu endpoint mới dùng cursor pagination → thêm vào `operations` trong `orval.config.ts` rồi `pnpm gen:hooks` lại

---

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách fix |
|-----|-------------|----------|
| Type không tồn tại sau thêm field | Chưa chạy lại `pnpm gen` | Chạy `pnpm gen` |
| Hook trả về `ApiResponse<T>` thay vì `T` | Chạy `gen:hooks` bỏ qua `gen:clean` | Chạy đúng thứ tự: `pnpm gen` |
| Endpoint mới cần infinite scroll nhưng không có `useInfiniteXxx` | Thiếu config trong `orval.config.ts` | Thêm `operations` entry với `useInfinite: true` |
| TypeScript error ở generated file | File bị sửa tay | Xóa `src/lib/api/generated/` rồi chạy lại `pnpm gen:hooks` |
