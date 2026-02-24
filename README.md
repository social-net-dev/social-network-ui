# ETECHS Social Network UI

> Frontend cho mạng xã hội ETECHS — xây dựng theo mô hình **contract-first** với TypeSpec + Orval, React 19, Tailwind CSS v4.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)

## Giới thiệu

Dự án là giao diện người dùng của mạng xã hội ETECHS, kết nối với backend qua một **API client được sinh tự động** từ TypeSpec contract. Toàn bộ kiểu dữ liệu trên frontend đều bắt nguồn từ contract — không có manual service hay type định nghĩa lại.

## Tính năng

- **Auth** — Đăng nhập, đăng ký (kèm upload ảnh xác minh), OTP, đổi mật khẩu
- **Feed** — Bảng tin vô hạn (infinite scroll), tạo bài viết, reaction, comment, chia sẻ
- **Profile** — Xem/chỉnh sửa hồ sơ, avatar, ảnh nền, thông tin học vấn, dự án
- **Bạn bè** — Danh sách bạn bè, lời mời kết bạn, gợi ý kết bạn
- **Thông báo** — Danh sách thông báo với unread count
- **Messages (E2EE)** — Nhắn tin mã hóa đầu cuối, backup/restore private key
- **Tìm kiếm** — Tìm kiếm người dùng theo username/tên
- **Admin** — Duyệt xác minh tài khoản, quản lý người dùng
- **Quyền riêng tư** — Kiểm soát từng trường thông tin (PUBLIC / FRIENDS / PRIVATE)

## Tech Stack

| Lớp | Công nghệ |
|-----|-----------|
| UI Framework | React 19 + Vite 7 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui + Lucide |
| Server State | TanStack Query v5 |
| Global State | Zustand |
| Forms | React Hook Form + Zod |
| API Client | Orval (tự động sinh từ OpenAPI) |
| API Contract | TypeSpec (`learn-typespec/`) |
| HTTP | Axios (interceptors, token refresh, response unwrap) |
| Routing | React Router v7 |

## Kiến trúc Contract-First

```
contract/main.tsp                  ← nguồn sự thật duy nhất
        ↓  pnpm gen:spec
tsp-output/schema/openapi.json     ← OpenAPI spec được sinh ra
        ↓  pnpm gen:api
src/lib/api/generated/             ← hooks + types tự động sinh
        ↓  import
src/features/*/hooks/              ← custom hooks dùng generated hooks
        ↓
src/features/*/components/         ← UI components
```

**Quy tắc bất biến:**
- Không viết kiểu dữ liệu trùng với generated model — import trực tiếp từ `@/lib/api/generated/model`
- Không viết Axios call thủ công — dùng generated hooks (`useXxx`, `xxxMutation`)
- Khi cần thêm field hay endpoint → sửa TypeSpec → chạy lại pipeline

## Cài đặt

### Yêu cầu
- Node.js ≥ 18
- pnpm ≥ 10 (`npm i -g pnpm`)

### Cài đặt & chạy

```bash
pnpm install

cp .env.example .env
# Chỉnh VITE_API_BASE_URL=http://localhost:8000/api

pnpm dev
# → http://localhost:5173
```

### Biến môi trường

| Biến | Mô tả | Mặc định dev |
|------|-------|--------------|
| `VITE_API_BASE_URL` | URL backend middleware | `http://localhost:8000/api` |
| `VITE_ENABLE_MOCK_API` | Dùng mock data (không cần backend) | `false` |

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `pnpm dev` | Dev server với HMR |
| `pnpm build` | Type-check + build production |
| `pnpm preview` | Xem trước build |
| `pnpm lint` | ESLint |
| `pnpm gen:spec` | Compile TypeSpec contract → `tsp-output/schema/openapi.json` |
| `pnpm gen:api` | Tái sinh API client từ openapi.json |
| `pnpm gen` | Chạy `gen:spec` + `gen:api` liên tiếp |

### Tái sinh API client (sau khi sửa TypeSpec)

```bash
# Compile contract + tái sinh client trong một lệnh
pnpm gen

# Hoặc từng bước:
pnpm gen:spec   # contract/main.tsp → tsp-output/schema/openapi.json
pnpm gen:api    # openapi.json → src/lib/api/generated/
```

## Cấu trúc dự án

```
src/
├── components/ui/          # shadcn/ui components
├── features/               # Feature modules
│   ├── auth/               # Login, Register, OTP
│   ├── home/               # Feed, PostCard, Comments
│   │   ├── components/
│   │   ├── hooks/          # useFeed, useComments, usePostActions
│   │   └── types/          # feed.types.ts (re-exports từ generated)
│   ├── profile/            # Profile, Settings, Privacy
│   ├── message/            # E2EE messaging
│   ├── friends/            # Friends list, requests
│   ├── notifications/      # Notification center
│   ├── admin/              # Admin dashboard
│   ├── media/              # Media upload/display
│   ├── posts/              # Public re-exports (PostCard, useFeed…)
│   └── shared/             # Avatar, Sidebar, Breadcrumbs
├── lib/
│   ├── api/
│   │   ├── generated/      # AUTO-GENERATED — không chỉnh tay
│   │   │   ├── model/      # TypeScript types
│   │   │   └── */          # Hooks theo domain (feed, posts, users…)
│   │   ├── attachRequestInterceptor.ts
│   │   ├── attachResponseInterceptor.ts   # Response unwrap + skipUnwrap
│   │   └── createApiClient.ts
│   └── utils/
│       └── api.ts          # getErrorMessage, buildMediaUrl, getDefaultAvatar
├── stores/
│   ├── authStore.ts        # User session (Zustand)
│   └── e2eeStore.ts        # E2EE key store
└── types/
    └── index.ts            # Re-exports từ generated model
```

## Quy ước quan trọng

### Import types

```ts
// ✅ Đúng — import từ generated model
import type { PostSummary, User, Author } from '@/lib/api/generated/model';

// ❌ Sai — không định nghĩa lại kiểu đã có trong contract
interface Post { id: string; author: { ... } }
```

### Gọi API

```ts
// ✅ Đúng — dùng generated hook
import { useFeedGetFeed } from '@/lib/api/generated/feed/feed';

// ❌ Sai — không gọi axios thủ công
axios.get('/feed')
```

### Pagination

Tất cả paginated responses đều dùng cấu trúc:
```ts
{
  items: T[];
  pagination: { page, page_size, total, total_pages }
}
```

## Docker Deployment

Tất cả file Docker đã được tổ chức trong thư mục `docker/`:

```bash
# Chạy với docker-compose
cd docker && docker compose up --build

# Hoặc từ root:
docker compose -f docker/docker-compose.yml up --build
```

Chi tiết xem **[docker/README.md](docker/README.md)**

## Brand Colors

| Màu | Hex | Dùng cho |
|-----|-----|----------|
| Dark Teal | `#0E4E5A` | Primary (light mode) |
| Lime Green | `#E2F046` | Accent, buttons, active states |
| Deep Blue | `#02182B` | Background (dark mode) |

## Tài liệu

- **[AGENTS.md](AGENTS.md)** — Hướng dẫn đầy đủ cho AI agents và contributors
- **[src/features/FEATURE_STRUCTURE.md](src/features/FEATURE_STRUCTURE.md)** — Cấu trúc feature module
- **[tsp-output/schema/openapi.json](tsp-output/schema/openapi.json)** — OpenAPI spec (được sinh tự động, không sửa tay)
- **[contract/main.tsp](contract/main.tsp)** — TypeSpec contract (nguồn sự thật)

---

© 2026 ETECHS Social Network.
