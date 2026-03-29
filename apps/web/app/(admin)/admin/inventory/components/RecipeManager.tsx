'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useDebounce } from '@/shared/hooks/use-debounce';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Loader2, Search, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DishIngredients } from '@/features/admin/components/dishes/dish-ingredients';
import type { DishDetailResType } from '@repo/schema';

export function RecipeManager() {
    const [selectedDishId, setSelectedDishId] = useState<string>('');
    const [searchDish, setSearchDish] = useState('');

    const debouncedSearch = useDebounce(searchDish, 500);

    // Queries
    const { data: dishesData, isLoading: isLoadingDishes } =
        trpc.dish.list.useQuery({
            page: 1,
            limit: 50,
            search: debouncedSearch || undefined,
        });

    const dishes = dishesData?.data || [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Dish Selection Sidebar */}
            <Card className="md:col-span-4 lg:col-span-3 border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <UtensilsCrossed className="h-5 w-5 text-primary" />
                        Danh sách món ăn
                    </CardTitle>
                    <CardDescription>
                        Chọn món để bắt đầu thiết lập
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm món ăn..."
                            className="pl-9 h-10 border-muted bg-card shadow-xs focus-visible:ring-primary/20"
                            value={searchDish}
                            onChange={(e) => setSearchDish(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1 max-h-150 overflow-y-auto pr-2 scrollbar-thin">
                        {isLoadingDishes ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        ) : dishes.length === 0 ? (
                            <p className="text-sm text-center text-muted-foreground p-4 bg-muted/20 rounded-lg">
                                Không tìm thấy món ăn nào
                            </p>
                        ) : (
                            dishes.map((dish: NonNullable<DishDetailResType>) => (
                                <button
                                    key={dish.id}
                                    onClick={() => setSelectedDishId(dish.id)}
                                    className={cn(
                                        'w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border',
                                        selectedDishId === dish.id
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'hover:bg-muted hover:border-muted-foreground/20 border-transparent text-foreground/80',
                                    )}
                                >
                                    {dish.dishTranslations?.[0]?.name ||
                                        'Không có tên'}
                                </button>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Recipe Details */}
            <Card className="md:col-span-8 lg:col-span-9 border-none shadow-none bg-transparent">
                <CardContent className="px-0 pt-0">
                    {!selectedDishId ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-2xl bg-muted/10">
                            <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">
                                Chưa có món ăn được chọn
                            </p>
                            <p className="text-xs text-muted-foreground/60">
                                Hãy chọn một món từ danh sách bên trái để thiết
                                lập công thức.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-card rounded-2xl border p-6 shadow-sm">
                            <DishIngredients dishId={selectedDishId} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
