# 🚀 ETECHS Social Network UI

> Giao diện mạng xã hội hiện đại, tập trung vào trải nghiệm người dùng và hiệu suất, được xây dựng cho hệ sinh thái công nghệ ETECHS.

![Project Status](https://img.shields.io/badge/status-development-orange)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-7-purple)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Giới thiệu

Dự án này là Frontend cho mạng xã hội ETECHS, được thiết kế với phong cách hiện đại (Modern Tech), hỗ trợ đầy đủ Dark/Light mode và tương thích tốt trên mọi thiết bị.

Hệ thống sử dụng các công nghệ mới nhất như React 19, Tailwind CSS v4 và shadcn/ui để đảm bảo hiệu suất và khả năng mở rộng.

## ✨ Tính năng chính

*   **🔐 Xác thực (Auth)**: Đăng nhập, Đăng ký, Xác thực OTP.
*   **📰 Bảng tin (Feed)**: Xem bài viết, hình ảnh, tương tác (Like, Comment).
*   **👤 Hồ sơ người dùng (Profile)**:
    *   Ảnh bìa & Avatar tùy chỉnh.
    *   Thống kê (Followers, Following, Posts).
    *   Tabs nội dung (Bài viết, Ảnh, Video).
*   **⚙️ Cài đặt (Settings)**:
    *   Chỉnh sửa thông tin cá nhân.
    *   **Trung tâm quyền riêng tư**: Kiểm soát ai xem được thông tin của bạn.
*   **🎨 Giao diện**:
    *   Theme thương hiệu ETECHS (Dark Teal & Lime Green).
    *   Chế độ Sáng/Tối (Dark Mode) hoàn chỉnh.
    *   Responsive Design (Mobile First).

## 🛠 Tech Stack

*   **Core**: [React 19](https://react.dev/), [Vite 7](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Global State), [TanStack Query](https://tanstack.com/query/latest) (Server State)
*   **Forms**: React Hook Form + Zod Validation
*   **Networking**: Axios (với Interceptors & Refresh Token logic)

## 🚀 Cài đặt & Chạy dự án

### 1. Yêu cầu tiên quyết
*   **Node.js** (v18 trở lên)
*   **pnpm** (khuyên dùng, project dùng `packageManager: "pnpm@10.28.2"`) hoặc **npm**

### 2. Cài đặt dependencies

```bash
cd social-network-ui
pnpm install
```

*(Nếu không dùng pnpm: `npm install`)*

### 3. Cấu hình môi trường

Tạo file `.env` từ mẫu (hoặc tạo mới):

```bash
cp .env.example .env
```

Chỉnh `.env`:

| Biến | Mô tả | Ví dụ |
|------|--------|--------|
| `VITE_API_BASE_URL` | URL API backend (**etechs-middleware**). UI gọi thẳng middleware. | `http://localhost:8000/api` (dev) hoặc `/api` (production) |
| `VITE_ENABLE_MOCK_API` | Bật API giả (không cần backend). | `true` / `false` |

* **Chạy với backend thật** (etechs-middleware): đặt `VITE_API_BASE_URL=http://localhost:8000/api` và `VITE_ENABLE_MOCK_API=false` (hoặc bỏ dòng này). Mặc định dev đã dùng `http://localhost:8000/api`.
* **Chạy chỉ với dữ liệu giả**: `VITE_ENABLE_MOCK_API=true`.

### 4. Chạy Development Server

```bash
pnpm dev
```

*(Hoặc `npm run dev` nếu dùng npm.)*

Mở trình duyệt: **http://localhost:5173**

## 📜 Các lệnh (Scripts) có sẵn

| Lệnh | Mô tả |
| :--- | :--- |
| `pnpm dev` | Chạy server phát triển (Hot Reload) |
| `pnpm build` | Kiểm tra Type và Build production |
| `pnpm preview` | Xem trước bản build production |
| `pnpm lint` | Kiểm tra lỗi cú pháp (ESLint) |

## 📂 Cấu trúc dự án

```text
src/
├── components/         # Các component tái sử dụng
│   └── ui/             # Component từ shadcn/ui
├── features/           # Modules theo tính năng (Auth, Profile, Home...)
│   ├── auth/           # Login, Register, OTP...
│   ├── home/           # News Feed...
│   └── profile/        # Profile Page, Settings...
├── lib/                # Tiện ích chung (Axios, Utils...)
├── stores/             # Quản lý state toàn cục (Zustand)
├── types/              # Định nghĩa TypeScript Types
└── App.tsx             # Routing & Main Layout
```

## 📚 Tài liệu

Tài liệu kỹ thuật được tổ chức như sau:

- **[AGENTS.md](AGENTS.md)** - Hướng dẫn toàn diện cho AI agents và developers
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Cấu trúc và quy ước documentation
- **[openapi.yml](openapi.yml)** - Đặc tả API đầy đủ (OpenAPI 3.0)
- **[src/features/FEATURE_STRUCTURE.md](src/features/FEATURE_STRUCTURE.md)** - Cấu trúc module
- **TypeScript code** - Types và comments trong source code
  - [E2EE_README.md](docs/features/E2EE_README.md) - E2EE Feature Guide
  - [DISPLAY_NAME_README.md](docs/features/DISPLAY_NAME_README.md) - Display Name Feature
  - [SEARCH_USERS_README.md](docs/features/SEARCH_USERS_README.md) - User Search

## 🎨 Màu sắc thương hiệu (Brand Colors)

Dự án sử dụng bảng màu đặc trưng của ETECHS:

| Màu | Hex | Variable | Sử dụng |
| :--- | :--- | :--- | :--- |
| **Dark Teal** | `#0E4E5A` | `--primary` (Light) / `--secondary` (Dark) | Nền chính, Text đậm |
| **Lime Green** | `#E2F046` | `--secondary` (Light) / `--primary` (Dark) | Điểm nhấn, Buttons, Active states |
| **Deep Blue** | `#02182B` | `--background` (Dark) | Nền chế độ tối |

## 🤝 Đóng góp

1.  Fork dự án
2.  Tạo branch tính năng (`git checkout -b feature/AmazingFeature`)
3.  Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4.  Push lên branch (`git push origin feature/AmazingFeature`)
5.  Mở Pull Request

---
© 2026 ETECHS Social Network.
