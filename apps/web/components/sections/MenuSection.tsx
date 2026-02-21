import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Star, Search } from 'lucide-react';
import { toast } from 'sonner';

import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils/format';
import { DishDetailModal } from '@/components/menu/dish-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

const MenuSection = () => {
    const { trackInteraction } = useAnalytics();

    const [activeCategoryId, setActiveCategoryId] = useState<
        string | undefined
    >(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            if (searchQuery.trim().length > 0) {
                trackInteraction('SEARCH', undefined, {
                    query: searchQuery.trim(),
                });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, trackInteraction]);

    // Fetch Categories
    const { data: categoriesData, isLoading: isLoadingCategories } =
        trpc.category.list.useQuery({
            limit: 10,
            page: 1,
        });
    const categories = categoriesData?.data || [];

    // Fetch Dishes
    const { data: dishesData, isLoading: isLoadingDishes } =
        trpc.dish.list.useQuery({
            categoryId:
                activeCategoryId === 'all' ? undefined : activeCategoryId,
            search: debouncedSearch || undefined,
            limit: 8,
            page: 1,
            isActive: true,
        });

    const dishes = dishesData?.data || [];

    const handleCategoryChange = (id: string) => {
        setActiveCategoryId(id === 'all' ? undefined : id);
    };

    const handleSelectDish = (dishId: string) => {
        setSelectedDishId(dishId);
        trackInteraction('VIEW', dishId);
    };

    return (
        <section id="menu" className="py-20 bg-background">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="inline-block text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                        Thực đơn
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Khám phá hương vị đường phố
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Mỗi chiếc bánh mì là một tác phẩm nghệ thuật, kết hợp
                        hoàn hảo giữa vỏ bánh giòn và nhân thịt thơm lừng.
                    </p>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 mx-auto">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm món ăn..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-background"
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                        <Button
                            variant={
                                activeCategoryId === undefined
                                    ? 'hero'
                                    : 'outline'
                            }
                            size="sm"
                            onClick={() => handleCategoryChange('all')}
                        >
                            Tất cả
                        </Button>
                        {isLoadingCategories
                            ? Array.from({ length: 4 }).map((_, i) => (
                                  <Skeleton key={i} className="h-9 w-24" />
                              ))
                            : categories.map((category) => (
                                  <Button
                                      key={category.id}
                                      variant={
                                          activeCategoryId === category.id
                                              ? 'hero'
                                              : 'outline'
                                      }
                                      size="sm"
                                      onClick={() =>
                                          handleCategoryChange(category.id)
                                      }
                                  >
                                      {category.name}
                                  </Button>
                              ))}
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoadingDishes
                        ? Array.from({ length: 8 }).map((_, i) => (
                              <div
                                  key={i}
                                  className="rounded-2xl overflow-hidden bg-muted h-87.5 animate-pulse"
                              />
                          ))
                        : dishes.map((dish, index) => {
                              const image =
                                  dish.images?.[0] || '/placeholder-food.jpg'; // Fallback image
                              // const rating = 4.8; // Placeholder rating as backend doesn't support it yet

                              return (
                                  <div
                                      key={dish.id}
                                      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 animate-fade-in-up flex flex-col"
                                      style={{
                                          animationDelay: `${index * 100}ms`,
                                      }}
                                  >
                                      {/* Image */}
                                      <div
                                          className="relative aspect-square overflow-hidden cursor-pointer"
                                          onClick={() =>
                                              handleSelectDish(dish.id)
                                          }
                                      >
                                          <Image
                                              src={image}
                                              alt={dish.name || 'Món ăn'}
                                              fill
                                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                                          />
                                          {/* {dish.isPopular && (
                                            <div className="absolute top-3 left-3 bg-chili text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                                                Bán chạy
                                            </div>
                                        )} */}
                                          {/* <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                                            <Star className="w-3 h-3 text-primary fill-primary" />
                                            <span className="text-xs font-semibold">
                                                {rating}
                                            </span>
                                        </div> */}
                                      </div>

                                      {/* Content */}
                                      <div className="p-4 flex flex-col flex-1">
                                          <h3
                                              className="font-display text-lg font-semibold text-card-foreground mb-1 cursor-pointer hover:text-primary transition-colors"
                                              onClick={() =>
                                                  handleSelectDish(dish.id)
                                              }
                                          >
                                              {dish.name}
                                          </h3>
                                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                                              {dish.description}
                                          </p>

                                          <div className="flex items-center justify-between mt-auto">
                                              <span className="text-lg font-bold text-primary">
                                                  {formatCurrency(
                                                      dish.basePrice,
                                                  )}
                                              </span>
                                              <Button
                                                  variant="hero"
                                                  size="sm"
                                                  onClick={() =>
                                                      handleSelectDish(dish.id)
                                                  } // Open detail modal on Add too for customization
                                              >
                                                  <Plus className="w-4 h-4 ml-0 mr-1" />
                                                  Thêm
                                              </Button>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                </div>

                {!isLoadingDishes && dishes.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            Không tìm thấy món ăn nào.
                        </p>
                    </div>
                )}

                {/* View All Button */}
                <div className="text-center mt-12">
                    <Button variant="warm" size="lg" asChild>
                        <a href="/menu">Xem tất cả thực đơn</a>
                    </Button>
                </div>
            </div>

            <DishDetailModal
                isOpen={!!selectedDishId}
                dishId={selectedDishId}
                onClose={() => setSelectedDishId(null)}
            />
        </section>
    );
};

export default MenuSection;
