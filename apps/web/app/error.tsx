'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight">
                Something went wrong!
            </h2>
            <p className="text-muted-foreground">
                We apologize for the inconvenience. Please try again.
            </p>
            <Button onClick={() => reset()} variant="outline">
                Try again
            </Button>
        </div>
    );
}
