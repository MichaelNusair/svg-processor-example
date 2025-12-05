# Backend Dockerfile for SVG Processor API
#
# Multi-stage build for smaller production image

# ==========================================================================
# Stage 1: Build
# ==========================================================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY libs/shared-types/package.json ./libs/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY tsconfig.base.json ./
COPY libs/shared-types ./libs/shared-types
COPY apps/backend ./apps/backend

# Build shared types first
WORKDIR /app/libs/shared-types
RUN pnpm build

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# ==========================================================================
# Stage 2: Production
# ==========================================================================
FROM node:20-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs/shared-types/dist ./node_modules/@svg-processor/shared-types/dist

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "dist/index.js"]

