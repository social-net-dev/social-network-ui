# Bruno API Collection - ETechs Middleware

Đã tích hợp Bruno - công cụ API testing open-source, nhẹ và nhanh - vào dự án ETechs Middleware API.

## Cấu trúc

```
bruno/
├── bruno.json              # Cấu hình collection
├── environments/           # Environment configs
│   ├── local.bru           # Local (http://localhost:8000)
│   └── production.bru      # Production
├── collections/            # API requests
│   ├── auth/              # Authentication (6 requests)
│   ├── users/             # User management (8 requests)
│   ├── feed/              # Feed (1 request)
│   ├── posts/             # Post CRUD (6 requests)
│   ├── comments/          # Comments (5 requests)
│   ├── reactions/         # Reactions (4 requests)
│   ├── shares/            # Sharing (2 requests)
│   ├── friends/           # Friend system (9 requests)
│   ├── notifications/     # Notifications (5 requests)
│   ├── profiles/          # Profiles (1 request)
│   ├── search/            # Search (1 request)
│   ├── system/            # System endpoints (1 request)
│   └── test/              # Test endpoints (1 request)
└── README.md              # Hướng dẫn chi tiết
```

## Cài đặt

### 1. Cài đặt Bruno CLI (để chạy tests)

```bash
npm install -g @usebruno/cli
```

### 2. Cài đặt Bruno Desktop App (để dev)

Download từ: https://www.usebruno.com/downloads

## Sử dụng

### Chạy với CLI

```bash
cd bruno

# Chạy tất cả requests
bru run --env Local

# Chạy folder cụ thể
bru run --env Local auth
bru run --env Local posts

# Chạy với báo cáo
bru run --env Local \
  --reporter-json results.json \
  --reporter-junit results.xml \
  --reporter-html results.html
```

### Sử dụng với Desktop App

1. Mở Bruno
2. File → Import Folder → Chọn `bruno/`
3. Chọn environment: Local/Production
4. Chạy request

## Các Workflow thông thường

### 1. Authentication Flow

1. `auth/register.bru` - Đăng ký tài khoản mới
   - Trả về `user_id` (tự động lưu vào environment)
2. `auth/verify-otp.bru` - Xác thực OTP (cần `user_id`)
   - Nhập OTP từ email
3. `auth/login.bru` - Đăng nhập
   - Trả về `access` và `refresh` tokens (tự động lưu)
4. `auth/who-am-i.bru` - Kiểm tra thông tin user hiện tại
   - Yêu cầu authentication

### 2. Post Management Flow

1. `posts/create.bru` - Tạo post mới
   - Body: `content_text`, `visibility`, `post_type`
   - Trả về `post_id` (cập nhật thủ công)
2. `posts/get-detail.bru` - Xem chi tiết post
3. `posts/update.bru` - Cập nhật post (PATCH)
4. `posts/my-posts.bru` - Xem danh sách post của mình
5. `posts/list.bru` - Xem danh sách tất cả posts
6. `posts/delete.bru` - Xóa post

### 3. Comment & Reaction Flow

1. `comments/create.bru` - Thêm comment
   - Body: `post_id`, `content_text`
2. `comments/list-by-post.bru` - Xem comments của post
3. `comments/reply.bru` - Trả lời comment
   - Body: `post_id`, `content_text`
4. `reactions/post-react.bru` - Thả react vào post
   - URL: `/posts/{post_id}/reactions/` (plural)
   - Body: `reaction: "LIKE"`
5. `reactions/comment-react.bru` - Thả react vào comment
   - URL: `/comments/{comment_id}/reactions/` (plural)
   - Body: `reaction: "LIKE"`

### 4. User Management Flow

1. `users/get-me.bru` - Lấy thông tin user hiện tại
2. `users/update-profile.bru` - Cập nhật thông tin cá nhân
   - Body: `display_name`, `bio`, `location`, etc.
3. `users/update-privacy.bru` - Cập nhật cài đặt riêng tư
4. `users/upload-avatar.bru` - Upload ảnh đại diện
5. `users/upload-background.bru` - Upload ảnh bìa
6. `users/deactivate.bru` - Vô hiệu hóa tài khoản
7. `users/reactivate.bru` - Kích hoạt lại tài khoản
8. `users/create-reactivation-request.bru` - Tạo yêu cầu kích hoạt

### 5. Friend Management Flow

1. `friends/send-request.bru` - Gửi lời mời kết bạn
   - Body: `addressee_id` (UUID)
2. `friends/outgoing-requests.bru` - Xem các lời mời đã gửi
3. `friends/accept-request.bru` - Chấp nhận lời mời
4. `friends/list.bru` - Xem danh sách bạn bè
5. `friends/remove.bru` - Xóa bạn

## Dynamic Variables

Các biến cần cập nhật thủ công từ response:

| Variable                  | Mô tả                               | Lấy từ request                                 |
| ------------------------- | ----------------------------------- | ---------------------------------------------- |
| `user_id`                 | ID của user (UUID)                  | register.bru response                          |
| `post_id`                 | ID của post (UUID)                  | posts/create.bru response                      |
| `comment_id`              | ID của comment (UUID)               | comments/create.bru response                   |
| `notification_id`         | ID của notification (UUID)          | notifications/list.bru response                |
| `friend_id`               | ID của friend (UUID)                | friends/list.bru response                      |
| `request_id`              | ID của friend request (UUID)        | friends/incoming-requests.bru response         |
| `username`                | Username của user                   | Tự nhập                                        |
| `target_user_id`          | ID của user muốn kết bạn (UUID)     | Tự nhập                                        |
| `reactivation_request_id` | ID của yêu cầu kích hoạt lại (UUID) | users/create-reactivation-request.bru response |

**Lưu ý:**

- `auth_token` và `refresh_token` được lưu tự động sau login
- Cập nhật `post_id` sau khi tạo post mới
- Cập nhật `comment_id` sau khi tạo comment

## Environment Variables

| Variable        | Mô tả                         | Mặc định                |
| --------------- | ----------------------------- | ----------------------- |
| `base_url`      | Base URL của API server       | `http://localhost:8000` |
| `api_base`      | API base URL (bao gồm `/api`) | `{{base_url}}/api`      |
| `auth_token`    | JWT access token              | (được lưu sau login)    |
| `refresh_token` | JWT refresh token             | (được lưu sau login)    |

## CI/CD

GitHub Actions đã được cấu hình tại `.github/workflows/bruno-api-tests.yml`:

```bash
# Run API tests with Bruno
cd bruno
bru run --env Local \
  --reporter-junit results.xml \
  --reporter-html results.html
```

## Lưu ý quan trọng

1. **Methods HTTP:**
   - Update operations dùng `PATCH` (không phải POST)
   - Delete operations dùng `DELETE`
2. **Response format:**
   - Login/Refresh responses KHÔNG wrap trong `data` key
   - Truy cập trực tiếp: `res.body.access`, `res.body.refresh`

3. **Reaction endpoints:**
   - Create: `/posts/{post_id}/reactions/` (plural, POST)
   - Delete: `/posts/{post_id}/reactions/` (plural, DELETE)
   - Reaction values: `LIKE`, `LOVE`, `HAHA`, `WOW`, `SAD`, `ANGRY`

4. **Share endpoint:**
   - Body field: `message` hoặc `commentary_text` (optional)

5. **Friend request:**
   - Body field: `addressee_id` (UUID) hoặc `addressee_username`
   - Không có field `message`

6. **Post update:**
   - URL: `/posts/{post_id}/update/`
   - Method: `PATCH`
   - Body: `content_text`, `visibility`, `media_uploads`

7. **Comment update:**
   - URL: `/comments/{comment_id}/update/`
   - Method: `PATCH`
   - Body: `content_text`

8. **User profile:**
   - Field: `display_name` (không phải `full_name`)

9. **Verify OTP & Resend OTP:**
   - Dùng `user_id` (UUID) thay vì `email`
