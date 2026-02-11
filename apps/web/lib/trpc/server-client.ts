/**
 * Server-side TRPC client for calling backend from Next.js API routes
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@repo/trpc';
import superjson from 'superjson';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052';

export const serverTrpc = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: `${BACKEND_URL}/v1/api/trpc`,
            transformer: superjson,
            // Add custom headers if needed
            headers() {
                return {};
            },
        }),
    ],
});
