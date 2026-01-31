# Tham khảo etechs-operation/operation-fe: build FE + Caddy runtime (không dùng Nginx)
# syntax=docker/dockerfile:1

# =========================================
# Stage 1: Build
# =========================================
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS build

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@10.28.2 --activate || corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prefer-offline || pnpm install

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

# =========================================
# Stage 2: Caddy (serve /srv + proxy /api)
# =========================================
FROM caddy:2-alpine AS runtime

COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
COPY docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
RUN chmod +x /usr/bin/docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/usr/bin/docker-entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
