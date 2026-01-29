# Frontend Authentication Implementation

## 🎉 Hoàn thành tích hợp Auth với Backend!

### ✅ Đã triển khai:

#### 1. **Đăng ký (Register) với upload CCCD**

- ✅ Form đăng ký đầy đủ:
    - Email (bắt buộc)
    - Password (tối thiểu 8 ký tự, chữ hoa + số)
    - Display Name (tên hiển thị)
    - Phone (tuỳ chọn)
    - Role (USER/BUSINESS/ORGANIZATION)
    - Upload CCCD mặt trước & mặt sau (bắt buộc)
    - Checkbox đồng ý điều khoản

- ✅ Sau khi đăng ký thành công → chuyển tới trang OTP verification

#### 2. **Xác thực OTP**

- ✅ Trang OTP Verification:
    - Nhập mã OTP 6 chữ số
    - Resend OTP nếu không nhận được
    - Hiển thị email đã đăng ký
    - Sau khi verify thành công → chuyển tới Login với thông báo
- ✅ Thông báo: "Xác thực OTP thành công! Tài khoản của bạn đang chờ admin phê duyệt..."

#### 3. **Đăng nhập (Login)**

- ✅ Form đăng nhập:
    - Email + Password
    - Remember me checkbox
    - Hiển thị success message từ OTP verification
- ✅ Sau khi login thành công:
    - Lưu `access_token` và `refresh_token`
    - Lưu thông tin user vào Zustand store
    - Redirect tới trang chính (Feed)

#### 4. **Refresh Token tự động**

- ✅ Axios interceptor tự động:
    - Detect 401 Unauthorized
    - Gọi API `/auth/refresh` để lấy token mới
    - Retry request ban đầu với token mới
    - Nếu refresh thất bại → logout và redirect về login

#### 5. **Logout**

- ✅ Logout chính xác:
    - Gọi API `/auth/logout` để revoke tokens ở backend
    - Xóa tokens khỏi localStorage
    - Clear Zustand store
    - Redirect về trang login

---

## 🚀 Hướng dẫn test

### Bước 1: Start Frontend

```bash
cd social-network-ui
npm install
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

### Bước 2: Đăng ký tài khoản mới

1. Truy cập: http://localhost:5173/register
2. Điền thông tin:
    - Email: test@example.com
    - Password: Test1234
    - Display Name: Nguyễn Văn Test
    - Phone: 0123456789 (tuỳ chọn)
    - Role: Chọn loại tài khoản
    - Upload ảnh CCCD (2 ảnh bất kỳ)
    - Check "Tôi đồng ý điều khoản"
3. Click "Tạo tài khoản"
4. Bạn sẽ được chuyển tới trang OTP

### Bước 3: Xác thực OTP

1. Mở MailHog: http://localhost:8025
2. Tìm email mới nhất với subject "Your OTP Code"
3. Copy mã OTP 6 chữ số
4. Paste vào form OTP verification
5. Click "Xác thực OTP"
6. Bạn sẽ được chuyển tới Login với thông báo thành công

### Bước 4: Chờ Admin phê duyệt

⚠️ **Quan trọng**: Sau khi verify OTP, tài khoản ở trạng thái **PENDING** và cần admin approve

#### Cách approve (dùng Swagger):

1. Mở Swagger: http://localhost:8000/docs
2. Login với admin account:
    - Username: admin@example.com
    - Password: 123456Az
3. Copy access_token
4. Click "Authorize" ở góc trên → paste token
5. Tìm endpoint: `POST /auth/verify-id-card/{user_id}/approve`
6. Nhập `user_id` (ID của user vừa đăng ký)
7. Execute để approve

### Bước 5: Đăng nhập

1. Quay lại frontend: http://localhost:5173/login
2. Đăng nhập với:
    - Email: test@example.com
    - Password: Test1234
3. Click "Đăng nhập"
4. Bạn sẽ được redirect tới Feed page

---

## 📁 Files đã thay đổi/tạo mới

### Cập nhật:

- [lib/axios.ts](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/lib/axios.ts) - Thêm refresh token logic
- [features/auth/types/auth.types.ts](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/types/auth.types.ts) - Thêm types cho Register, OTP
- [features/auth/services/authApi.ts](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/services/authApi.ts) - Implement đầy đủ API calls
- [features/auth/components/RegisterForm.tsx](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/components/RegisterForm.tsx) - Form với upload CCCD
- [features/auth/components/LoginForm.tsx](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/components/LoginForm.tsx) - Thêm success message
- [features/auth/hooks/useRegister.ts](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/hooks/useRegister.ts) - Redirect tới OTP page
- [features/auth/routes.tsx](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/routes.tsx) - Thêm OTP route
- [stores/authStore.ts](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/stores/authStore.ts) - Async logout
- [App.tsx](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/App.tsx) - Thêm OTP route

### Tạo mới:

- [features/auth/pages/OTPVerifyPage.tsx](c:/Users/47011/OneDrive/workspace/ETECHS/Social-Network/social-network-ui/src/features/auth/pages/OTPVerifyPage.tsx) - Trang xác thực OTP

---

## 🔄 Luồng hoàn chỉnh

```
1. Register (upload CCCD)
   ↓
2. OTP sent to email (xem MailHog)
   ↓
3. Verify OTP → Status: PENDING
   ↓
4. Admin approve (qua Swagger)
   ↓
5. Login → Get access_token + refresh_token
   ↓
6. Access protected pages
   ↓
7. Token expired? → Auto refresh
   ↓
8. Logout → Revoke tokens
```

---

## 🛠️ Troubleshooting

### Lỗi khi đăng ký:

- Check Backend đang chạy: http://localhost:8000/health
- Check file upload size (max 10MB mỗi file)
- Check format ảnh (jpg, png, jpeg)

### Không nhận được OTP:

- Check MailHog: http://localhost:8025
- Check email đã đúng chưa
- Thử "Gửi lại OTP"

### Không login được:

- Check user đã được admin approve chưa
- Check password có đúng không (case-sensitive)
- Check Backend logs: `docker compose logs -f api`

### Token expired:

- Refresh token tự động chạy trong background
- Nếu refresh thất bại → bạn sẽ bị logout tự động

---

## 📝 Notes

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- MailHog: http://localhost:8025
- Swagger: http://localhost:8000/docs

**Admin credentials** (để approve users):

- Email: admin@example.com
- Password: 123456Az

---
