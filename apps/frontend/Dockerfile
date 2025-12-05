# Frontend Dockerfile for SVG Processor
#
# Multi-stage build: Build with Node, serve with nginx

# ==========================================================================
# Stage 1: Build
# ==========================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY libs/shared-types/package.json ./libs/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY libs/shared-types ./libs/shared-types
COPY apps/frontend ./apps/frontend

# Build shared types
WORKDIR /app/libs/shared-types
RUN pnpm build

# Build frontend
WORKDIR /app/apps/frontend
RUN pnpm build

# ==========================================================================
# Stage 2: Production (nginx)
# ==========================================================================
FROM nginx:alpine AS production

# Copy custom nginx config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

