'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils/format';
import { DishDetailModal } from '@/features/menu/components/dish-detail-modal';
import { useAnalytics } from '@/shared/hooks/useAnalytics';

const RecommendationsSection = () => {
    const { trackInteraction } = useAnalytics();
    const [selectedDishId, setSelectedDishId] = useState<string | null>(null);

    const { data: recommendationsData, isLoading } =
        trpc.recommendation.getForUser.useQuery(
            { limit: 4 },
            {
                refetchOnWindowFocus: false,
                retry: 1,
            },
        );

    const dishes = recommendationsData?.items || [];

    const handleSelectDish = (dishId: string) => {
        setSelectedDishId(dishId);
        trackInteraction('VIEW', dishId, { source: 'recommendations' });
    };

    if (!isLoading && dishes.length === 0) {
        return null; // Hide section entirely if no data
    }

    return (
        <section className="pt-20 pb-10 bg-background/50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-12 relative">
                    <div className="absolute inset-x-0 -top-8 h-32 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 uppercase tracking-wider">
                        ✨ Dành riêng cho bạn
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Gợi ý hôm nay
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Những món ăn được chọn lọc đặc biệt mang đến trải nghiệm tuyệt vời cho bạn.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {isLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <div
                                  key={i}
                                  className="rounded-2xl bg-muted/50 h-87.5 animate-pulse skeleton"
                              />
                          ))
                        : dishes.map((dish, index) => {
                              const image =
                                  dish.images?.[0] || '/placeholder-food.jpg';

                              return (
                                  <div
                                      key={dish.id}
                                      className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-all duration-300 animate-fade-in-up flex flex-col border border-border/50"
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
                                          {dish.reason && (
                                              <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
                                                  {dish.reason}
                                              </div>
                                          )}
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
                                                  }
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
            </div>

            <DishDetailModal
                isOpen={!!selectedDishId}
                dishId={selectedDishId}
                onClose={() => setSelectedDishId(null)}
            />
        </section>
    );
};

export default RecommendationsSection;
