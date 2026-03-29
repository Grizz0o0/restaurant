import { useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { InteractionTypeSchema } from '@repo/schema';
import { z } from 'zod';

export const useAnalytics = () => {
    const mutation = trpc.analytics.log.useMutation({
        onError: (err) => {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Analytics Tracking Error:', err.message);
            }
        },
    });

    const trackInteraction = useCallback(
        (
            action: z.infer<typeof InteractionTypeSchema>,
            dishId?: string,
            metadata?: Record<string, unknown>,
        ) => {
            mutation.mutate({
                action,
                dishId,
                metadata,
            });
        },
        [mutation],
    );

    return {
        trackInteraction,
    };
};
