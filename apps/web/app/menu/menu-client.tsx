'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { DishDetailModal } from '@/components/menu/dish-detail-modal';
import { useDebounce } from '@/hooks/use-debounce';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

export const MenuClient = () => {
    const [activeCategoryId, setActiveCategoryId] = useState<
        string | undefined
    >(undefined);
    const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data: categoriesData, isLoading: isLoadingCategories } =
        trpc.category.list.useQuery({
            limit: 50,
            page: 1,
        });

    const {
        data: dishesData,
        isLoading: isLoadingDishes,
        isFetching,
    } = trpc.dish.list.useQuery(
        {
            categoryId:
                activeCategoryId === 'all' ? undefined : activeCategoryId,
            search: debouncedSearchQuery,
            limit: pageSize,
            page: currentPage,
        },
        {
            keepPreviousData: true,
        } as any,
    );

    const categories = categoriesData?.data || [];
    const dishes = dishesData?.data || [];
    const pagination = dishesData?.pagination;

    const handleCategoryChange = (id: string) => {
        setActiveCategoryId(id === 'all' ? undefined : id);
        setCurrentPage(1); // Reset to first page
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1); // Reset to first page
    };

    const renderPagination = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        const { totalPages, page } = pagination;
        const pages = [];

        // Show max 5 page numbers
        let startPage = Math.max(1, page - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="mt-12">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                className={
                                    page === 1
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>

                        {startPage > 1 && (
                            <>
                                <PaginationItem>
                                    <PaginationLink
                                        onClick={() => setCurrentPage(1)}
                                        className="cursor-pointer"
                                    >
                                        1
                                    </PaginationLink>
                                </PaginationItem>
                                {startPage > 2 && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}
                            </>
                        )}

                        {pages.map((p) => (
                            <PaginationItem key={p}>
                                <PaginationLink
                                    isActive={p === page}
                                    onClick={() => setCurrentPage(p)}
                                    className="cursor-pointer"
                                >
                                    {p}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        {endPage < totalPages && (
                            <>
                                {endPage < totalPages - 1 && (
                                    <PaginationItem>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                )}
                                <PaginationItem>
                                    <PaginationLink
                                        onClick={() =>
                                            setCurrentPage(totalPages)
                                        }
                                        className="cursor-pointer"
                                    >
                                        {totalPages}
                                    </PaginationLink>
                                </PaginationItem>
                            </>
                        )}

                        <PaginationItem>
                            <PaginationNext
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
                                className={
                                    page === totalPages
                                        ? 'pointer-events-none opacity-50'
                                        : 'cursor-pointer'
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-secondary/50 border-b border-border">
                <div className="container mx-auto px-4 py-16">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                        Thực Đơn
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Khám phá các loại bánh mì thơm ngon của chúng tôi
                    </p>
                </div>
            </header>

            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Tìm kiếm món ăn..."
                                value={searchQuery}
                                onChange={(e) =>
                                    handleSearchChange(e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>

                        <div className="flex-1 w-full md:ml-auto max-w-full md:max-w-212 overflow-hidden">
                            <div className="flex overflow-x-auto pb-1 md:pb-0 no-scrollbar gap-x-3 md:flex-wrap md:justify-end">
                                <Button
                                    variant={
                                        activeCategoryId === undefined
                                            ? 'hero'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={() => handleCategoryChange('all')}
                                    className="whitespace-nowrap mb-2"
                                >
                                    Tất cả
                                </Button>
                                {isLoadingCategories
                                    ? Array.from({ length: 12 }).map((_, i) => (
                                          <div
                                              key={i}
                                              className="h-9 min-w-25 bg-muted animate-pulse rounded-md shrink-0"
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
                                              className="whitespace-nowrap shrink-0"
                                          >
                                              {category.name}
                                          </Button>
                                      ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12">
                {isLoadingDishes && !dishes.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-100 bg-muted animate-pulse rounded-2xl"
                            />
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {dishes.map((item: any) => (
                                <div
                                    key={item.id}
                                    className={cn(
                                        'group bg-card rounded-2xl overflow-hidden border border-border hover:shadow-warm transition-all duration-300 flex flex-col cursor-pointer',
                                        item.isAvailable === false &&
                                            'opacity-75',
                                    )}
                                    onClick={() => setSelectedDishId(item.id)}
                                >
                                    <div className="relative aspect-square overflow-hidden bg-muted">
                                        {item.images?.[0] ? (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name || 'Món ăn'}
                                                fill
                                                className={cn(
                                                    'object-cover group-hover:scale-105 transition-transform duration-500',
                                                    item.isAvailable ===
                                                        false &&
                                                        'grayscale opacity-80',
                                                )}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                No Image
                                            </div>
                                        )}
                                        {item.isAvailable === false && (
                                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                                <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold text-sm uppercase tracking-wider">
                                                    Tạm hết hàng
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-display text-xl font-bold text-foreground mb-2">
                                            {item.name}
                                        </h3>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center justify-between mt-auto pt-4">
                                            <span className="text-lg font-bold text-primary">
                                                {formatCurrency(item.basePrice)}
                                            </span>
                                            <Button
                                                variant="warm"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDishId(item.id);
                                                }}
                                                disabled={
                                                    item.isAvailable === false
                                                }
                                            >
                                                {item.isAvailable === false
                                                    ? 'Hết hàng'
                                                    : 'Thêm'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {renderPagination()}
                    </>
                )}

                {!isLoadingDishes && dishes.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-lg">
                            Không tìm thấy món ăn phù hợp
                        </p>
                    </div>
                )}
            </main>

            <DishDetailModal
                isOpen={!!selectedDishId}
                dishId={selectedDishId}
                onClose={() => setSelectedDishId(null)}
            />
        </div>
    );
};
