# API Layer (Manual Integration)

Dự án đã chuyển đổi từ Orval Auto-generated sang **Manual API Integration** để đảm bảo tính ổn định, kiểm soát kiểu dữ liệu chặt chẽ và khớp hoàn toàn với cấu trúc phản hồi thực tế từ backend.

## Cấu trúc (Manual API Architecture)

Hệ thống API tuân thủ quy trình 4 lớp:

1.  **Types** (`src/lib/api/types/`): Định nghĩa interfaces cho Request và Response (Backend Model).
2.  **Services** (`src/lib/api/services/`): Các hàm gọi Axios sử dụng `apiClient`. Đảm bảo map đúng endpoint.
3.  **Hooks** (`src/lib/api/hooks/`): Các React Query hooks (useQuery, useMutation) đóng gói logic gọi Service.
4.  **Transforms** (`src/lib/api/transforms/`): Chuyển đổi dữ liệu từ Backend (`snake_case`) sang Frontend model (`camelCase`).

```
src/lib/api/
├── types/           # Backend API Models & Requests
├── services/        # Axios calls organized by feature
├── hooks/           # React Query hooks wrapper
├── transforms/      # Logic BE (snake_case) -> FE (camelCase)
├── apiClient.ts     # Axios instance với Interceptors
└── index.ts         # Central exports
```

## Quy tắc (Standards)

✅ **LUÔN LUÔN** định nghĩa kiểu dữ liệu rõ ràng trong `types/`.
✅ **ƯU TIÊN** sử dụng "Smart Hooks" thay vì gọi trực tiếp Service trong component.
✅ **SỬ DỤNG** layer `transforms/` để giữ code UI sạch sẽ và dùng chuẩn `camelCase`.
✅ **API Client**: `apiClient` đã có interceptor tự động unwrap định dạng `{ success: true, data: T }`.

## Ví dụ sử dụng (Example)

```typescript
import { useUser } from '@/lib/api/hooks/useUser';

// Tự động transform BE -> FE và xử lý cache qua select option
const { user, isLoading } = useUser('me'); 

// user lúc này đã có type Author chuẩn FE (camelCase)
if (user) {
  console.log(user.displayName); 
}
```

## Auth & Interceptors
Hệ thống sử dụng `apiClient` hỗ trợ:
- Tự động đính kèm JWT Token & Tenant ID từ Auth Store.
- Refresh Token logic tự động khi gặp lỗi 401.
- Xử lý lỗi tập trung qua `toast`.
