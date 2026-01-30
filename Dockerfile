# Syntax version
# syntax=docker/dockerfile:1

# =========================================
# Stage 1: Build the Application
# =========================================
ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS builder

# Set working directory
WORKDIR /app

# Enable pnpm via Corepack (dùng version từ package.json nếu có)
RUN corepack enable
RUN corepack prepare pnpm@10.28.2 --activate || corepack prepare pnpm@latest --activate

# Copy package configuration files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (bỏ --frozen-lockfile để tránh lỗi khi lockfile không khớp)
RUN pnpm install --prefer-offline || pnpm install

# Copy source code
COPY . .

# Build-time API URL (same origin khi chạy sau nginx: để trống hoặc https://fe.example.com)
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN pnpm build

# =========================================
# Stage 2: Serve with Nginx
# =========================================
FROM nginxinc/nginx-unprivileged:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (default for unprivileged nginx)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
