import { Skeleton } from '@/shared/ui/skeleton';

export default function Loading() {
    return (
        <div className="min-h-screen bg-background">
            <header className="bg-secondary/50 border-b border-border">
                <div className="container mx-auto px-4 py-6">
                    <div className="w-24 h-6 mb-4 bg-muted rounded animate-pulse" />
                    <div className="w-48 h-12 bg-muted rounded animate-pulse" />
                    <div className="w-72 h-6 mt-2 bg-muted rounded animate-pulse" />
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="bg-card rounded-2xl overflow-hidden border border-border"
                        >
                            <Skeleton className="h-64 w-full" />
                            <div className="p-5 space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                                <div className="flex justify-between items-center pt-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
