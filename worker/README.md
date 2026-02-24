# OpenAPI Worker (Hono + Swagger UI)

Worker này phục vụ tài liệu OpenAPI dưới dạng JSON và Swagger UI.

## Endpoints

- `GET /health`
- `GET /openapi.json`
- `GET /swagger`
- `GET /` → redirect sang `/swagger`

## Chạy local

```bash
pnpm worker:dev
```

## Deploy

```bash
pnpm worker:deploy
```

Lưu ý: `openapi.json` được lấy từ `tsp-output/schema/openapi.json`.
Nếu contract thay đổi, chạy lại:

```bash
pnpm gen:spec
```
