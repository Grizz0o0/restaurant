import { useCallback } from 'react';
import { trpc } from '@/lib/trpc/client';
import { InteractionTypeSchema } from '@repo/schema';
import { z } from 'zod';

export const useAnalytics = () => {
    const utils = trpc.useUtils();
    const mutation = trpc.analytics.log.useMutation({
        onError: (err) => {
            // Silently fail for standard users, log only in development
            if (process.env.NODE_ENV === 'development') {
                console.warn('Analytics Tracking Error:', err.message);
            }
        },
    });

    const trackInteraction = useCallback(
        (
            action: z.infer<typeof InteractionTypeSchema>,
            dishId?: string,
            metadata?: any,
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
