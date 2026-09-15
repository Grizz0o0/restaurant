#!/bin/sh
set -e

echo "🚀 [Entrypoint] Running database migrations..."
npx prisma db push --skip-generate

echo "🌱 [Entrypoint] Running database seed..."
pnpm run db:seed || echo "⚠️ [Entrypoint] Seeding finished or warning encountered."

echo "🌟 [Entrypoint] Starting application..."
exec "$@"