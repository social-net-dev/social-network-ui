# API Layer

## Structure

```
src/lib/api/
├── generated/           # Auto-generated từ OpenAPI spec (via Orval)
│   ├── auth/           # Auth hooks (useLogin, useRegister, etc.)
│   ├── feed/           # Feed hooks (useGetFeed, useCreatePost, etc.)
│   └── model/          # Shared TypeScript types
└── README.md           # This file
```

## Manual APIs (Current)

Manual APIs vẫn ở `src/features/*/services/`:
- `src/features/auth/services/authApi.ts`
- `src/features/home/services/feedApi.ts`
- `src/features/profile/services/profileApi.ts`
- etc.

## Generate API Client

**Khi backend đã có OpenAPI spec:**

1. Đảm bảo backend running và có `/openapi.json` endpoint
2. Chạy command:
   ```bash
   pnpm gen:api
   ```
3. Check output trong `src/lib/api/generated/`

## Usage Example (After Generate)

```typescript
// BEFORE (Manual API với React Query)
import { feedApi } from '@/features/home/services/feedApi';
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['feed', page],
  queryFn: () => feedApi.getPosts(page, 10),
});

// AFTER (Orval Generated Hook)
import { useGetFeed } from '@/lib/api/generated/feed/feed';

const { data } = useGetFeed({ page, limit: 10 });
```

## Migration Guide

Khi migrate từ manual API sang Orval:

1. **Giữ nguyên manual API file** - Đừng xóa ngay
2. **Tạo component mới** dùng generated hook để test
3. **So sánh kết quả** giữa manual và generated
4. **Replace dần** trong các component
5. **Cuối cùng** mới xóa manual API file

## Axios Instance

Tất cả API calls (manual và generated) đều dùng chung axios instance tại:
- `src/lib/api.ts` - Unified instance với refresh token, unwrap middleware

Orval mutator được config tại:
- `src/lib/axios-instance.ts` - Wrapper cho Orval

## Troubleshooting

### "Cannot find module '@/lib/api/generated/...'"
→ Chưa generate. Chạy `pnpm gen:api` trước.

### "Network Error" khi generate
→ Backend chưa running hoặc `/openapi.json` endpoint không tồn tại.

### Types không khớp với manual API
→ Có thể do backend thay đổi schema. Re-generate và update manual types.
