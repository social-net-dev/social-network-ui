# API Layer (Single Source of Truth)

## Structure

Toàn bộ hệ thống API được thống nhất về một nguồn duy nhất sử dụng **Orval** để generate code từ OpenAPI spec của backend.

```
src/lib/api/
├── generated/           # Auto-generated từ OpenAPI spec (via Orval)
│   ├── index.ts        # Barrel exports với namespaces (AuthAPI, PostsV2API, v.v.)
│   ├── auth/           # Auth hooks
│   ├── posts-v2/       # Feed/Posts hooks
│   └── model/          # TypeScript models (Backend schema)
├── transforms/          # Layer chuyển đổi dữ liệu BE -> FE (camelCase, format)
├── manual-apis.ts       # Các endpoints hiếm hoi thiếu trong OpenAPI spec
└── axios-instance.ts    # Orval mutator wrapper
```

## Nguồn sự thật duy nhất (Single Source of Truth)

🚫 **KHÔNG** tự viết manual API services trong `src/features/*/services/`.
🚫 **KHÔNG** tự viết manual TypeScript interfaces cho dữ liệu từ API.

✅ **LUÔN LUÔN** sử dụng generated hooks từ `@/lib/api/generated`.
✅ **SỬ DỤNG** transform layer tại `@/lib/api/transforms` để format dữ liệu cho UI.

## Quy trình làm việc

### 1. Khi Backend thay đổi API
Đảm bảo backend đang chạy, sau đó chạy command:
```bash
pnpm gen:api
```

### 2. Cách sử dụng mới (Example)

Nên sử dụng các **Smart Hooks** tại `src/lib/api/hooks/` thay vì gọi trực tiếp generated hooks nếu có logic biến đổi dữ liệu phức tạp.

```typescript
import { useUser } from '@/lib/api/hooks/useUser';

// Tự động transform BE -> FE và xử lý cache
const { user, isLoading } = useUser('me'); 

// user lúc này đã có type Author chuẩn FE (camelCase)
console.log(user.displayName); 
```

### 3. Transform Layer & Smart Hooks
- **Transforms**: Nơi định nghĩa logic convert `snake_case` (BE) -> `camelCase` (FE).
- **Smart Hooks**: Wrapper quanh generated hooks, sử dụng option `select` để tự động transform dữ liệu ngay khi nhận được từ server.

## Axios & Authentication
Hệ thống sử dụng chung một `apiClient` tại `src/lib/api.ts` hỗ trợ:
- Tự động đính kèm Token & Tenant ID.
- Refresh Token logic với hàng đợi (Queue).
- Unwrap middleware response `{ success: true, data: T }`.

## Quy định (ESLint)
Đã cấu hình rule `no-restricted-imports` để ngăn chặn việc tạo lại các manual API services. Nếu bạn cố gắng import từ `**/services/*Api`, linter sẽ báo lỗi.
