'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';
import { trpc } from './client';
import superjson from 'superjson';

let refreshPromise: Promise<boolean> | null = null;

export default function TRPCProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [
                httpBatchLink({
                    transformer: superjson,
                    // Point to Next.js API proxy instead of direct backend
                    url: '/api/trpc',
                    // Custom fetch to handle token refresh
                    fetch: async (url, options) => {
                        const response = await fetch(url, options);

                        if (response.status === 401) {
                            // If we are already refreshing, wait for it to complete
                            if (refreshPromise) {
                                await refreshPromise;
                                return fetch(url, options);
                            }

                            // Start refreshing
                            refreshPromise = (async () => {
                                try {
                                    const refreshRes = await fetch(
                                        '/api/auth/refresh',
                                        {
                                            method: 'POST',
                                        },
                                    );
                                    return refreshRes.ok;
                                } catch (e) {
                                    return false;
                                } finally {
                                    refreshPromise = null;
                                }
                            })();

                            const success = await refreshPromise;

                            if (success) {
                                // Retry original request
                                return fetch(url, options);
                            }
                        }

                        return response;
                    },
                }),
            ],
        }),
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
