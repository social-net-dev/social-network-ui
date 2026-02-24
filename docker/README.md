# Docker Deployment

Thư mục này chứa tất cả file cấu hình liên quan đến Docker deployment cho ETECHS Social Network UI.

## Files

- **`Dockerfile`** — Multi-stage build: Node.js (build) → Caddy (runtime)
- **`docker-compose.yml`** — Compose config để chạy container local hoặc production
- **`Caddyfile`** — Caddy config: serve static files + reverse proxy `/api` → `etechs-middleware`
- **`docker-entrypoint.sh`** — Entrypoint script tạo runtime config (`window.__ENV__`)

## Quick Start

### Development (local)

```bash
# Từ thư mục docker/
docker compose up --build

# Hoặc từ root project:
docker compose -f docker/docker-compose.yml up --build
```

App sẽ chạy tại **http://localhost:8080**

### Production

```bash
# Build image
docker build -f docker/Dockerfile -t etechs-social-ui:latest .

# Run với custom env
docker run -d \
  -p 80:80 \
  -e VITE_API_BASE_URL=/api \
  -e APP_DOMAIN=social.etechs.vn \
  --name social-ui \
  etechs-social-ui:latest
```

## Environment Variables

| Variable | Mô tả | Mặc định |
|----------|-------|----------|
| `VITE_API_BASE_URL` | URL backend API (được inject vào runtime config) | `/api` |
| `APP_DOMAIN` | Domain cho Caddy (`:80` local, `example.com` production) | `:80` |

## Architecture

```
┌─────────────────────────────────────────┐
│  Caddy (port 80/443)                    │
│  ┌─────────────────────────────────┐    │
│  │ /api/* → etechs-middleware:8001 │    │
│  │ /ws/*  → etechs-middleware:8001 │    │
│  │ /*     → /srv (static SPA)      │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## Notes

- **Multi-stage build** giảm image size (chỉ giữ lại `/dist` + Caddy runtime)
- **Runtime config injection** cho phép thay đổi `VITE_API_BASE_URL` mà không cần rebuild
- **Caddy tự động HTTPS** khi `APP_DOMAIN` là domain thật (không phải `:80`)
- **Health check** endpoint: `/health` (proxy tới middleware)

## Network

Container cần kết nối với `etechs-middleware` qua Docker network `etechs-middleware_etechs-network` (external).

Nếu chạy standalone, bỏ phần `networks` trong `docker-compose.yml` và cấu hình `etechs-middleware` URL khác.
