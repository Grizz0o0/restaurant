'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Star, MessageSquareDot, Package } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/shared/ui/button';

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`h-4 w-4 ${
                        s <= rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-muted text-muted-foreground/20'
                    }`}
                />
            ))}
        </div>
    );
}

export function UserReviews() {
    const [page, setPage] = useState(1);

    const { data, isLoading } = trpc.review.myReviews.useQuery({
        page,
        limit: 8,
    });

    const reviews = data?.data ?? [];
    const pagination = data?.pagination;

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 text-center border rounded-lg bg-card">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Chưa có đánh giá nào</h3>
                <p className="text-muted-foreground mt-1 mb-4 text-sm">
                    Đặt một đơn hàng và đánh giá món ăn của bạn nhé!
                </p>
                <Button asChild variant="hero">
                    <Link href="/menu">Xem thực đơn</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="border rounded-xl bg-card p-5 space-y-3 transition-shadow hover:shadow-sm"
                >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="space-y-1">
                            <p className="font-semibold text-sm">
                                🍽️{' '}
                                {review.dish?.dishTranslations?.[0]?.name ??
                                    'Món ăn'}
                            </p>
                            <StarDisplay rating={review.rating} />
                        </div>
                        <time className="text-xs text-muted-foreground shrink-0">
                            {format(
                                new Date(review.createdAt),
                                'HH:mm, dd/MM/yyyy',
                                {
                                    locale: vi,
                                },
                            )}
                        </time>
                    </div>

                    {/* Review content */}
                    <p className="text-sm leading-relaxed text-foreground">
                        {review.content}
                    </p>

                    {/* Admin reply */}
                    {review.adminReply && (
                        <div className="rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 flex items-start gap-2">
                            <MessageSquareDot className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-primary mb-1">
                                    Phản hồi từ nhà hàng
                                </p>
                                <p className="text-sm text-foreground/90">
                                    {review.adminReply}
                                </p>
                            </div>
                        </div>
                    )}

                    {!review.adminReply && (
                        <p className="text-xs text-muted-foreground italic">
                            Nhà hàng chưa phản hồi đánh giá này...
                        </p>
                    )}
                </div>
            ))}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrev}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Trước
                    </Button>
                    <span className="flex items-center text-sm font-medium px-2">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNext}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Sau
                    </Button>
                </div>
            )}
        </div>
    );
}
