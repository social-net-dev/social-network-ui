# 📘 Hướng dẫn gọi API Type-Safe

## 🎯 Tổng quan

Dự án sử dụng cấu trúc type-safe cho tất cả API calls với:

- **Generic Types** cho axios requests/responses
- **Tách biệt rõ ràng** giữa FE models và BE response types
- **Type inference** tự động cho code completion

## 📁 Cấu trúc File

```
src/
├── types/
│   └── api.types.ts           # Generic API response types (IBackendRes, IModelPaginate)
├── features/
│   └── home/
│       ├── types/
│       │   └── feed.types.ts  # FE models (FeedPost, FeedComment) + BE types (IBackendPost)
│       └── services/
│           └── feedApi.ts     # Typed API calls
```

## 🔧 1. Generic API Types

**File**: `src/types/api.types.ts`

```typescript
/**
 * Generic backend response wrapper
 */
export interface IBackendRes<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Paginated response model
 */
export interface IModelPaginate<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
```

## 🎨 2. Định nghĩa Types

### Frontend Models (schema FE RÕ RÀNG)

**File**: `src/features/home/types/feed.types.ts`

```typescript
/**
 * Frontend Post Model - Schema FE RÕ RÀNG
 */
export interface FeedPost {
  id: string;
  author: Author;
  content: string;
  mediaUrls: string[];
  stats: {
    reactions: number;
    comments: number;
    shares: number;
  };
  userReaction: ReactionType | null;
  sharedPost: FeedPost | null;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Frontend Comment Model
 */
export interface FeedComment {
  id: string;
  postId: string;
  author: Author;
  parentCommentId: string | null;
  content: string;
  mediaUrls: string[];
  stats: {
    reactions: number;
    replies: number;
  };
  userReaction: ReactionType | null;
  createdAt: string;
}
```

### Backend Response Types

```typescript
/**
 * Backend Post Response
 */
export interface IBackendPost {
  id: string;
  author_id: string;
  author: IBackendAuthor;
  content_text: string;
  media_paths: string[] | null;
  media_urls: string[] | null;
  media_files?: IBackendMediaFile[];
  visibility: string;
  shared_post_id: string | null;
  shared_post: IBackendPost | null;
  created_at: string;
  updated_at: string;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  user_reaction: string | null;
}

/**
 * Backend Comment Response
 */
export interface IBackendComment {
  id: string;
  post_id: string;
  author_id: string;
  author: IBackendAuthor;
  parent_comment_id: string | null;
  content_text: string;
  media_paths: string[] | null;
  media_urls: string[] | null;
  media_files: IBackendMediaFile[];
  created_at: string;
  reaction_count: number;
  reply_count: number;
  user_reaction: string | null;
}
```

## 🌐 3. Gọi API với Generic Types

**File**: `src/features/home/services/feedApi.ts`

### GET Request (Lấy danh sách)

```typescript
/**
 * Lấy danh sách bài viết (feed)
 * GET /feed/
 */
getPosts: async (page = 1, limit = 10): Promise<FeedPost[]> => {
  const res = await api.get<PaginatedResponse<IBackendPost>>("/feed/", {
    params: { page, limit },
  });

  const data = res.data;
  const posts = data?.posts || data?.items || [];

  return posts.map(normalizePostWithToken);
};
```

### POST Request (Tạo mới)

```typescript
/**
 * Tạo bài viết mới
 * POST /posts/
 */
createPost: async (form: FormData): Promise<FeedPost> => {
  const res = await api.post<IBackendRes<IBackendPost>>("/posts/", form, {
    headers: { "Content-Type": undefined as unknown as string },
  });

  return normalizePostWithToken(res.data.data || res.data);
};
```

### PUT Request (Cập nhật)

```typescript
/**
 * Cập nhật nội dung bài viết
 * PUT /posts/{postId}
 */
updatePost: async (postId: string, content: string): Promise<FeedPost> => {
  const res = await api.put<IBackendRes<IBackendPost>>(`/posts/${postId}`, {
    content_text: content,
  });

  return normalizePostWithToken(res.data.data || res.data);
};
```

### DELETE Request (Xóa)

```typescript
/**
 * Xóa bài viết
 * DELETE /posts/{postId}
 */
deletePost: async (postId: string): Promise<void> => {
  await api.delete<IBackendRes<[]>>(`/posts/${postId}`);
};
```

## 🔄 4. Transform Functions (BE → FE)

```typescript
/**
 * Chuyển đổi Backend Post → Frontend Post
 */
const transformPost = (post: IBackendPost): any => {
  let mediaUrls: string[] = [];

  // Priority: media_files > media_urls > media_paths
  if (Array.isArray(post.media_files) && post.media_files.length > 0) {
    mediaUrls = post.media_files
      .map((m) => m.file_url || m.file_path)
      .filter(Boolean);
  } else if (Array.isArray(post.media_urls)) {
    mediaUrls = post.media_urls.filter(Boolean);
  } else if (Array.isArray(post.media_paths)) {
    mediaUrls = post.media_paths.filter(Boolean);
  }

  return {
    id: post.id,
    author: transformAuthor(post.author),
    content: post.content_text,
    mediaUrls,
    stats: {
      reactions: post.reaction_count,
      comments: post.comment_count,
      shares: post.share_count,
    },
    userReaction: post.user_reaction,
    sharedPost: post.shared_post ? transformPost(post.shared_post) : null,
    visibility: post.visibility,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
};
```

## 📝 5. Ví dụ Thực tế

### Tạo CustomerGroup API (ví dụ của bạn)

```typescript
// 1. Định nghĩa types
// src/features/customer/types/customer.types.ts

/**
 * Frontend CustomerGroup Model
 */
export interface CustomerGroup {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend CustomerGroup Response
 */
export interface IBackendCustomerGroup {
  id: string;
  name: string;
  des: string;
  created_at: string;
  updated_at: string;
}

// 2. API Service
// src/features/customer/services/customerApi.ts

import api from "@/lib/axios";
import type { IBackendRes, IModelPaginate } from "@/types/api.types";
import type {
  CustomerGroup,
  IBackendCustomerGroup,
} from "../types/customer.types";

/**
 * Lấy danh sách CustomerGroup
 */
export const callFetchCustomerGroup = (params?: Record<string, any>) => {
  return api.get<IBackendRes<IModelPaginate<IBackendCustomerGroup>>>(
    `/api/customer-groups/`,
    { params },
  );
};

/**
 * Tạo CustomerGroup mới
 */
export const callCreateCustomerGroup = (name: string, des: string) => {
  return api.post<IBackendRes<IBackendCustomerGroup>>(`/api/customer-groups/`, {
    name,
    des,
  });
};

/**
 * Cập nhật CustomerGroup
 */
export const callUpdateCustomerGroup = (
  id: string,
  name: string,
  des: string,
) => {
  return api.put<IBackendRes<IBackendCustomerGroup>>(
    `/api/customer-groups/${id}/`,
    { name, des },
  );
};

/**
 * Xóa CustomerGroup
 */
export const callDeleteCustomerGroup = (id: string) => {
  return api.delete<IBackendRes<[]>>(`/api/customer-groups/${id}/`);
};

/**
 * Lấy CustomerGroup theo ID
 */
export const callGetByIdCustomerGroup = (id: string) => {
  return api.get<IBackendRes<IBackendCustomerGroup>>(
    `/api/customer-groups/${id}/`,
  );
};

// 3. Transform function (optional - nếu cần chuyển BE → FE format)
const transformCustomerGroup = (
  data: IBackendCustomerGroup,
): CustomerGroup => ({
  id: data.id,
  name: data.name,
  description: data.des,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});
```

### Sử dụng trong Component

```typescript
import {
  callFetchCustomerGroup,
  callCreateCustomerGroup,
} from "./services/customerApi";

// GET - Lấy danh sách
const fetchGroups = async () => {
  try {
    const res = await callFetchCustomerGroup({ page: 1, limit: 10 });
    const data = res.data.data; // IModelPaginate<IBackendCustomerGroup>
    console.log("Groups:", data.items);
    console.log("Total:", data.total);
  } catch (error) {
    console.error("Error:", error);
  }
};

// POST - Tạo mới
const createGroup = async () => {
  try {
    const res = await callCreateCustomerGroup(
      "VIP Customers",
      "High value customers",
    );
    const newGroup = res.data.data; // IBackendCustomerGroup
    console.log("Created:", newGroup);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

## ✅ Best Practices

### ✔️ DO (Làm đúng)

```typescript
// ✅ Dùng generic type cho axios
const res = await api.get<IBackendRes<IBackendPost[]>>("/posts/");

// ✅ Extract data với fallback
const posts = res.data.data || res.data || [];

// ✅ Type-safe array operations
const result = Array.isArray(posts) ? posts : [];

// ✅ Transform BE → FE
return posts.map(transformPost);
```

### ❌ DON'T (Tránh làm)

```typescript
// ❌ Không dùng any
const res: any = await api.get("/posts/");

// ❌ Không skip type checking
const posts = res.data.data;

// ❌ Không access trực tiếp không có null check
return res.data.map(transformPost); // Error nếu data là null!
```

## 🎁 Lợi ích

1. **Type Safety**: TypeScript catch lỗi khi compile
2. **Auto-completion**: IntelliSense gợi ý chính xác
3. **Refactoring dễ dàng**: Đổi tên field tự động update
4. **Documentation**: Types = documentation
5. **Maintainable**: Code dễ đọc, dễ bảo trì

## 🔗 Tham khảo

- [feedApi.ts](../src/features/home/services/feedApi.ts) - Ví dụ đầy đủ
- [feed.types.ts](../src/features/home/types/feed.types.ts) - Type definitions
- [api.types.ts](../src/types/api.types.ts) - Generic types
