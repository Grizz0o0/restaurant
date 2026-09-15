# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all package.json files for workspace resolution
COPY apps/api/package.json ./apps/api/
COPY packages/schema/package.json ./packages/schema/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/constant/package.json ./packages/constant/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Build
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

# Copy workspace configuration and all installed node_modules from deps stage
COPY --from=deps /app ./

# Copy source code (will not copy or overwrite node_modules thanks to .dockerignore)
COPY . .

# Build shared packages first
RUN pnpm --filter @repo/constants build
RUN pnpm --filter @repo/schema build

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build the API
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm --filter api build

# ============================================
# Stage 3: Production runtime
# ============================================
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.28.1 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy built output and production dependencies
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/src/generated ./apps/api/src/generated
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
RUN chmod +x ./apps/api/docker-entrypoint.sh

WORKDIR /app/apps/api

EXPOSE 3052

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
