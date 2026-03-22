'use client';

import { usePosStore } from '@/store/pos-store';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Search, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import Image from 'next/image';

export function PosMenu() {
    const {
        selectedCategoryId,
        setCategory,
        searchQuery,
        setSearchQuery,
        addToCart,
    } = usePosStore();

    const { data: categoriesData, isLoading: loadingCategories } =
        trpc.category.list.useQuery({
            page: 1,
            limit: 100,
        });

    const { data: dishesData, isLoading: loadingDishes } =
        trpc.dish.list.useQuery({
            page: 1,
            limit: 500,
        });

    const categories = categoriesData?.data || [];
    const allDishes = dishesData?.data || [];

    // Filter dishes active and based on selected category & search query
    const filteredDishes = useMemo(() => {
        return allDishes.filter((dish) => {
            // Only show active dishes in POS
            if (!dish.isActive) return false;

            const matchCategory =
                selectedCategoryId === 'all' ||
                (dish.categories &&
                    dish.categories.some((c) => c.id === selectedCategoryId));
            const matchSearch = (dish.name || '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            return matchCategory && matchSearch;
        });
    }, [allDishes, selectedCategoryId, searchQuery]);

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    return (
        <div className="flex flex-col h-full w-full bg-background relative isolate">
            {/* Top Bar: Search & Categories */}
            <div className="flex flex-col shrink-0 border-b bg-background shadow-xs z-10">
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Tìm món ăn..."
                            className="pl-9 h-10 w-full bg-muted/50 focus-visible:ring-primary border-transparent focus-visible:border-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-2 px-3 pb-3 overflow-x-auto scroll-smooth custom-scrollbar">
                    <button
                        onClick={() => setCategory('all')}
                        className={cn(
                            'px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0',
                            selectedCategoryId === 'all'
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95',
                        )}
                    >
                        Tất cả
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setCategory(category.id)}
                            className={cn(
                                'px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
                                selectedCategoryId === category.id
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground active:scale-95',
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Dishes Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
                {loadingCategories || loadingDishes ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredDishes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground h-full opacity-60">
                        <UtensilsCrossed className="h-12 w-12 mb-4" />
                        <p className="font-medium text-lg">
                            Không tìm thấy món ăn
                        </p>
                        <p className="text-sm mt-1">
                            Vui lòng thử từ khóa khác hoặc chọn danh mục khác.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                        {filteredDishes.map((dish) => (
                            <button
                                key={dish.id}
                                onClick={() => addToCart(dish)}
                                className="group relative flex flex-col bg-background rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 active:translate-y-0 active:scale-95 text-left h-full"
                            >
                                <div className="aspect-4/3 w-full bg-muted relative overflow-hidden">
                                    {dish.images && dish.images.length > 0 ? (
                                        <>
                                            <Image
                                                src={dish.images[0] as string}
                                                alt={dish.name || 'Dish'}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                            {dish.isAvailable === false && (
                                                <div className="absolute top-2 right-2 z-10 pointer-events-none">
                                                    <Badge variant="destructive" className="shadow-md text-[10px] px-1.5 py-0 h-4 uppercase opacity-90">
                                                        Thiếu kho
                                                    </Badge>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
                                            <UtensilsCrossed className="h-8 w-8 text-primary/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-3 flex flex-col flex-1 justify-between gap-1">
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                        {dish.name}
                                    </h3>
                                    <div className="font-bold text-primary text-sm mt-auto">
                                        {formatVnd(Number(dish.basePrice))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
