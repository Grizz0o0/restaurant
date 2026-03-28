'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Star,
    MessageSquareQuote,
    Calendar,
    Search,
    FilterX,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { format } from 'date-fns';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { useDebounce } from '@/hooks/use-debounce';

export default function ReviewsClientPage() {
    const [page, setPage] = useState(1);
    const [activeCategoryId, setActiveCategoryId] = useState<
        string | undefined
    >(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 500);
    const limit = 12;

    const { data: categoriesData, isLoading: isLoadingCategories } =
        trpc.category.list.useQuery(
            { limit: 50, page: 1 },
            { refetchOnWindowFocus: false },
        );

    const { data, isLoading } = trpc.review.list.useQuery(
        {
            page,
            limit,
            keyword: debouncedSearchQuery || undefined,
            categoryId:
                activeCategoryId === 'all' ? undefined : activeCategoryId,
        },
        {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
        } as any,
    );

    const categories = categoriesData?.data || [];

    const handleCategoryChange = (id: string) => {
        setActiveCategoryId(id === 'all' ? undefined : id);
        setPage(1); // Reset to first page
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setPage(1); // Reset to first page
    };

    const formatRating = (rating: number) => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                }`}
            />
        ));
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden">
            <div className="relative pt-32 pb-20 bg-card border-b border-border/50 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
                    <div className="absolute bottom-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-destructive/5 blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('/images/pattern-light.svg')] opacity-5" />
                </div>

                <div className="container px-4 mx-auto max-w-6xl relative z-10">
                    <div className="flex flex-col items-center text-center animate-fade-in-up">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-primary/20 to-primary/5 text-primary mb-6 shadow-highlight border border-primary/10">
                            <MessageSquareQuote className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 tracking-tight">
                            Khách Hàng Nói Về{' '}
                            <span className="text-primary italic">
                                Chúng Tôi
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl px-4">
                            Khám phá những trải nghiệm ẩm thực chân thực nhất.
                            Sự hài lòng của bạn là nguồn cảm hứng lớn nhất để
                            chúng tôi không ngừng hoàn thiện.
                        </p>
                    </div>
                </div>
            </div>

            <div className="sticky top-16 md:top-20 z-40 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="container mx-auto max-w-6xl px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm đánh giá..."
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-10 h-11 bg-card shadow-sm border-border/50 focus:ring-primary/20"
                            />
                        </div>

                        <div className="flex-1 md:ml-auto max-w-212 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                            <div className="flex gap-x-3 gap-y-2 md:flex-wrap md:justify-end min-w-max md:min-w-0">
                                <Button
                                    variant={
                                        activeCategoryId === undefined
                                            ? 'hero'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => handleCategoryChange('all')}
                                    className="whitespace-nowrap rounded-lg h-9"
                                >
                                    Tất cả
                                </Button>
                                {isLoadingCategories
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                          <div
                                              key={i}
                                              className="h-9 min-w-20 bg-muted animate-pulse rounded-lg"
                                          />
                                      ))
                                    : categories.map((category: any) => (
                                          <Button
                                              key={category.id}
                                              variant={
                                                  activeCategoryId ===
                                                  category.id
                                                      ? 'hero'
                                                      : 'outline'
                                              }
                                              size="sm"
                                              onClick={() =>
                                                  handleCategoryChange(
                                                      category.id,
                                                  )
                                              }
                                              className="whitespace-nowrap rounded-lg h-9"
                                          >
                                              {category.name}
                                          </Button>
                                      ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container px-4 mx-auto max-w-6xl py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card rounded-4xl p-6 border border-border/50 shadow-soft h-87.5 animate-pulse skeleton"
                            />
                        ))}
                    </div>
                ) : data?.data.length === 0 ? (
                    <div className="bg-card/50 rounded-4xl p-16 text-center border border-dashed border-border/80 shadow-soft max-w-2xl mx-auto flex flex-col items-center">
                        <div className="w-24 h-24 mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                            <Search className="w-10 h-10 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                            Chưa tìm thấy đánh giá nào
                        </h3>
                        <p className="text-muted-foreground max-w-md">
                            {activeCategoryId !== undefined || searchQuery
                                ? 'Không có đánh giá nào phù hợp với bộ lọc hiện tại của bạn. Vui lòng thử lại với từ khóa hoặc danh mục khác.'
                                : 'Hiện tại chưa có đánh giá nào trong hệ thống.'}
                        </p>
                        {(activeCategoryId !== undefined || searchQuery) && (
                            <Button
                                variant="outline"
                                className="mt-6 rounded-full"
                                onClick={() => {
                                    handleCategoryChange('all');
                                    handleSearchChange('');
                                }}
                            >
                                <FilterX className="w-4 h-4 mr-2" /> Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="columns-1 md:columns-2 gap-8 space-y-8 pb-8">
                            {data?.data.map((review, index) => {
                                const dishImage =
                                    review.dish?.images?.[0] ||
                                    '/placeholder-food.jpg';
                                const dishName =
                                    review.dish?.dishTranslations?.[0]?.name ||
                                    'Món ăn';
                                const userInitial = review.user?.name
                                    ? review.user.name.charAt(0).toUpperCase()
                                    : '👤';

                                return (
                                    <div
                                        key={review.id}
                                        className="relative bg-card rounded-4xl p-8 border border-border/40 shadow-soft hover:shadow-xl transition-all duration-500 flex flex-col group animate-fade-in-up overflow-hidden break-inside-avoid mb-8"
                                        style={{
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                    >
                                        <div className="absolute -top-6 -right-6 text-9xl text-primary/5 font-serif leading-none select-none pointer-events-none group-hover:text-primary/10 transition-colors duration-500">
                                            &quot;
                                        </div>

                                        <div className="flex items-start justify-between mb-6 relative z-10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary font-display font-bold text-lg shadow-inner">
                                                    {userInitial}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-foreground text-sm tracking-tight mb-1">
                                                        {review.user?.name ||
                                                            'Khách hàng ẩn danh'}
                                                    </h4>
                                                    <div className="flex gap-0.5">
                                                        {formatRating(
                                                            review.rating,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted/30 border border-border/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                                                {format(
                                                    new Date(review.createdAt),
                                                    'dd/MM/yyyy',
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative z-10 mb-8">
                                            <p className="text-foreground/90 text-[15px] leading-relaxed italic">
                                                &quot;{review.content}&quot;
                                            </p>
                                        </div>

                                        <div className="relative z-10 flex flex-col gap-6">
                                            <div className="pt-5 border-t border-border/60">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-border/50 group-hover:ring-2 ring-primary/20 transition-all duration-300">
                                                        <Image
                                                            src={dishImage}
                                                            alt={dishName}
                                                            fill
                                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                                                            Món ăn đã đánh giá
                                                        </span>
                                                        <span className="font-semibold text-[15px] truncate text-foreground group-hover:text-primary transition-colors duration-300">
                                                            {dishName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {review.adminReply && (
                                                <div className="p-5 bg-linear-to-r from-primary/5 to-transparent rounded-2xl border-l-2 border-primary">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                                                            <span className="text-[9px] font-bold text-primary-foreground">
                                                                B
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground tracking-tight">
                                                            Phản hồi từ BAMIXO
                                                        </span>
                                                    </div>
                                                    <p className="text-[14px] text-foreground/80 leading-relaxed pl-7">
                                                        {review.adminReply}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {data?.pagination && data.pagination.totalPages > 1 && (
                            <div className="mt-16 border-t border-border/50 pt-8 flex justify-center">
                                <Pagination>
                                    <PaginationContent className="gap-2">
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (page > 1)
                                                        setPage(page - 1);
                                                }}
                                                className={`rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                                            />
                                        </PaginationItem>

                                        {[
                                            ...Array(
                                                data.pagination.totalPages,
                                            ),
                                        ].map((_, i) => (
                                            <PaginationItem key={i + 1}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={page === i + 1}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setPage(i + 1);
                                                    }}
                                                    className={`rounded-full w-10 h-10 transition-all ${page === i + 1 ? 'bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary hover:text-primary-foreground' : 'hover:bg-primary/10 hover:text-primary'}`}
                                                >
                                                    {i + 1}
                                                </PaginationLink>
                                            </PaginationItem>
                                        ))}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (
                                                        page <
                                                        data.pagination
                                                            .totalPages!
                                                    )
                                                        setPage(page + 1);
                                                }}
                                                className={`rounded-full hover:bg-primary/10 hover:text-primary transition-colors ${page >= data.pagination.totalPages! ? 'pointer-events-none opacity-50' : ''}`}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
