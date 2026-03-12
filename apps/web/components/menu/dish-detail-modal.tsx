import { useEffect, useState, useRef } from 'react';
import {
    Minus,
    Plus,
    Loader2,
    Clock,
    Flame,
    Star,
    Sparkles,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils/format';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/domain/use-auth';
import Image from 'next/image';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DishDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    dishId: string | null;
}

export function DishDetailModal({
    isOpen,
    onClose,
    dishId,
}: DishDetailModalProps) {
    const { isAuthenticated } = useAuth();
    const utils = trpc.useUtils();
    const { trackInteraction } = useAnalytics();
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const [currentDishId, setCurrentDishId] = useState<string | null>(dishId);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >({});

    // Sync currentDishId when dishId prop changes or modal opens
    useEffect(() => {
        if (isOpen && dishId) {
            setCurrentDishId(dishId);
        }
    }, [isOpen, dishId]);

    // Reset state when switching dishes
    useEffect(() => {
        setQuantity(1);
        setSelectedOptions({});
    }, [currentDishId]);

    const { data: dish, isLoading } = trpc.dish.detail.useQuery(
        { id: currentDishId as string },
        {
            enabled: !!currentDishId && isOpen,
        },
    );

    const relatedDishesQuery = trpc.dish.list.useQuery(
        {
            categoryId: dish?.categories?.[0]?.id,
            limit: 8,
        },
        {
            enabled: !!dish?.categories?.[0]?.id && isOpen,
        },
    );
    const relatedDishes =
        relatedDishesQuery.data?.data?.filter((d) => d.id !== currentDishId) ||
        [];

    // Get translations
    const viTranslation = dish?.dishTranslations?.find(
        (t) => t.languageId === 'vi',
    );
    const enTranslation = dish?.dishTranslations?.find(
        (t) => t.languageId === 'en',
    );
    const defaultTranslation =
        viTranslation || enTranslation || dish?.dishTranslations?.[0];

    // Get dish text data with fallback
    const dishName = defaultTranslation?.name || '';
    const dishDescription = defaultTranslation?.description || '';

    // Find matching SKU based on selected options
    const matchingSku = dish?.skus?.find((sku: any) => {
        if (!sku.variantOptions || !dish.variants) return false;
        const selectedOptionIds = Object.values(selectedOptions);
        if (selectedOptionIds.length !== dish.variants.length) return false;
        const skuOptionIds = sku.variantOptions.map((o: any) => o.id);
        return selectedOptionIds.every((id) => skuOptionIds.includes(id));
    }) as any;

    const currentPrice =
        dish?.variants && dish.variants.length > 0
            ? matchingSku?.price
            : dish?.basePrice;

    const handleOptionSelect = (variantId: string, optionId: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [variantId]: optionId,
        }));
    };

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    const addToCartMutation = trpc.cart.add.useMutation({
        onSuccess: () => {
            toast.success(`Đã thêm ${quantity} ${dishName} vào giỏ`, {
                position: 'top-center',
            });
            trackInteraction('ADD_CART', currentDishId as string, {
                quantity,
                skuId: matchingSku?.id,
            });
            utils.cart.get.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể thêm vào giỏ hàng', {
                position: 'top-center',
            });
        },
    });

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để đặt hàng', {
                position: 'top-center',
            });
            return;
        }

        if (!dish) return;

        let skuIdToAdd = null;

        if (dish.variants && dish.variants.length > 0) {
            if (!matchingSku) {
                toast.error('Vui lòng chọn đầy đủ các tùy chọn', {
                    position: 'top-center',
                });
                return;
            }
            skuIdToAdd = matchingSku.id;
        } else {
            const defaultSku = dish.skus?.find(
                (s: any) => !s.variantOptions || s.variantOptions.length === 0,
            );
            if (defaultSku) {
                skuIdToAdd = defaultSku.id;
            } else {
                toast.error('Sản phẩm này tạm thời không khả dụng', {
                    position: 'top-center',
                });
                return;
            }
        }

        if (skuIdToAdd) {
            addToCartMutation.mutate({
                skuId: skuIdToAdd,
                quantity: quantity,
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-115 p-0 flex flex-col gap-0 overflow-hidden max-h-[90vh] rounded-3xl">
                {isLoading || !dish ? (
                    <div className="flex flex-col items-center justify-center p-20 space-y-4">
                        <DialogTitle className="sr-only">
                            Đang tải chi tiết món ăn...
                        </DialogTitle>
                        <Loader2 className="h-10 w-10 animate-spin text-primary/80" />
                        <span className="text-sm text-muted-foreground font-medium">
                            Đang chuẩn bị...
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="overflow-y-auto flex-1 w-full bg-background no-scrollbar">
                            <DialogHeader className="p-0 text-left space-y-0 relative">
                                <div className="flex flex-col">
                                    {dish.images?.[0] && (
                                        <div className="relative w-full aspect-video sm:aspect-21/9 bg-muted/30 shrink-0 overflow-hidden rounded-b-3xl shadow-sm">
                                            <Image
                                                src={dish.images[0]}
                                                alt={dishName}
                                                fill
                                                className="object-cover"
                                                priority
                                                sizes="(max-width: 640px) 100vw, 800px"
                                            />
                                            {/* Badges Overlay on Image */}
                                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                                <div className="bg-orange-500/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Flame className="w-3 h-3 fill-current" />
                                                    Phổ biến
                                                </div>
                                                <div className="bg-blue-500/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Sparkles className="w-3 h-3 fill-current" />
                                                    Mới
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-6 pt-6 pb-2">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 rounded-md">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <span className="text-xs font-bold">
                                                    4.9
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="text-xs font-medium">
                                                    10-15 phút
                                                </span>
                                            </div>
                                        </div>

                                        <DialogTitle className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-tight mb-1">
                                            {dishName || 'Chi tiết món ăn'}
                                        </DialogTitle>

                                        <div className="text-primary font-black text-xl md:text-2xl">
                                            {currentPrice
                                                ? formatCurrency(
                                                      Number(currentPrice),
                                                  )
                                                : ''}
                                        </div>

                                        {dishDescription && (
                                            <div className="mt-4 text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                                                {dishDescription}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 p-6 pt-2">
                                {/* Variants */}
                                {dish.variants?.map((variant: any) => (
                                    <div key={variant.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[15px] font-black text-foreground/90 uppercase tracking-wider">
                                                {variant.name}
                                            </Label>
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                                                Bắt buộc
                                            </span>
                                        </div>
                                        <RadioGroup
                                            value={selectedOptions[variant.id]}
                                            onValueChange={(val) =>
                                                handleOptionSelect(
                                                    variant.id,
                                                    val,
                                                )
                                            }
                                            className="grid grid-cols-2 gap-2"
                                        >
                                            {variant.options.map(
                                                (option: any) => (
                                                    <div key={option.id}>
                                                        <RadioGroupItem
                                                            value={option.id}
                                                            id={option.id}
                                                            className="peer sr-only"
                                                        />
                                                        <Label
                                                            htmlFor={option.id}
                                                            className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-center cursor-pointer transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                                                        >
                                                            <span className="text-sm font-semibold text-foreground peer-data-[state=checked]:text-primary">
                                                                {option.value}
                                                            </span>
                                                            {option.priceModifier >
                                                                0 && (
                                                                <span className="text-xs font-medium text-muted-foreground mt-0.5">
                                                                    +
                                                                    {formatCurrency(
                                                                        option.priceModifier,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </RadioGroup>
                                    </div>
                                ))}

                                {/* Quantity */}
                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                    <span className="font-black text-[15px] text-foreground/90 uppercase tracking-wider">
                                        Số lượng
                                    </span>
                                    <div className="flex items-center gap-4 bg-muted/40 rounded-full p-1 border border-border/50">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-background text-foreground transition-all active:scale-95"
                                            onClick={() =>
                                                setQuantity(
                                                    Math.max(1, quantity - 1),
                                                )
                                            }
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-6 text-center font-bold text-lg">
                                            {quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-background text-foreground transition-all active:scale-95"
                                            onClick={() =>
                                                setQuantity(quantity + 1)
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Placeholder for Reviews */}
                                <div className="pt-6 border-t border-border/50 space-y-4">
                                    <h3 className="font-black text-[15px] text-foreground/90 uppercase tracking-wider">
                                        Đánh giá từ thực khách
                                    </h3>
                                    {dish.reviews && dish.reviews.length > 0 ? (
                                        <div className="space-y-4">
                                            {dish.reviews
                                                .slice(0, 3)
                                                .map((review: any) => (
                                                    <div
                                                        key={review.id}
                                                        className="bg-muted/20 p-4 rounded-2xl border border-border/40"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
                                                                    {review.user
                                                                        ?.avatar ? (
                                                                        <Image
                                                                            src={
                                                                                review
                                                                                    .user
                                                                                    .avatar
                                                                            }
                                                                            alt={
                                                                                review
                                                                                    .user
                                                                                    .name
                                                                            }
                                                                            width={
                                                                                32
                                                                            }
                                                                            height={
                                                                                32
                                                                            }
                                                                            className="object-cover"
                                                                        />
                                                                    ) : (
                                                                        <span className="font-bold text-primary text-xs">
                                                                            {review.user?.name?.charAt(
                                                                                0,
                                                                            ) ||
                                                                                'U'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold">
                                                                        {review
                                                                            .user
                                                                            ?.name ||
                                                                            'Thực khách'}
                                                                    </div>
                                                                    <div className="text-[10px] text-muted-foreground">
                                                                        {new Date(
                                                                            review.createdAt,
                                                                        ).toLocaleDateString(
                                                                            'vi-VN',
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                                {Array.from({
                                                                    length: 5,
                                                                }).map(
                                                                    (_, i) => (
                                                                        <Star
                                                                            key={
                                                                                i
                                                                            }
                                                                            className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-muted/30'}`}
                                                                        />
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                                            {review.content}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="bg-muted/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center border border-dashed border-border/60">
                                            <Star className="w-8 h-8 text-muted-foreground/30 mb-2" />
                                            <span className="text-sm font-medium text-muted-foreground">
                                                Chưa có đánh giá nào cho món này
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Related Dishes */}
                                {relatedDishes.length > 0 && (
                                    <div className="pt-6 border-t border-border/50 space-y-4 pb-4 overflow-hidden relative group/carousel">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-black text-[15px] text-foreground/90 uppercase tracking-wider">
                                                Món liên quan
                                            </h3>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full bg-muted/40 hover:bg-muted border border-border/50"
                                                    onClick={() =>
                                                        handleScroll('left')
                                                    }
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full bg-muted/40 hover:bg-muted border border-border/50"
                                                    onClick={() =>
                                                        handleScroll('right')
                                                    }
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div
                                            ref={scrollContainerRef}
                                            className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 -mx-1 no-scrollbar snap-x scroll-smooth"
                                        >
                                            {relatedDishes.map(
                                                (relatedDish) => (
                                                    <div
                                                        key={relatedDish.id}
                                                        onClick={() => {
                                                            setCurrentDishId(
                                                                relatedDish.id,
                                                            );
                                                            // Scroll to top
                                                            const modalContent =
                                                                document.querySelector(
                                                                    '.overflow-y-auto',
                                                                );
                                                            if (modalContent) {
                                                                modalContent.scrollTo(
                                                                    {
                                                                        top: 0,
                                                                        behavior:
                                                                            'smooth',
                                                                    },
                                                                );
                                                            }
                                                        }}
                                                        className="w-32 sm:w-36 flex flex-col gap-2 rounded-2xl shrink-0 snap-start cursor-pointer group"
                                                    >
                                                        <div className="w-full aspect-square rounded-2xl bg-muted/30 overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                                                            {relatedDish
                                                                .images?.[0] ? (
                                                                <Image
                                                                    src={
                                                                        relatedDish
                                                                            .images[0]
                                                                    }
                                                                    alt={
                                                                        relatedDish.name ||
                                                                        'Dish'
                                                                    }
                                                                    fill
                                                                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    sizes="144px"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                                                                    <span className="text-xs font-medium">
                                                                        Không
                                                                        ảnh
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors">
                                                                {
                                                                    relatedDish.name
                                                                }
                                                            </div>
                                                            <div className="text-xs font-semibold text-primary mt-0.5">
                                                                {formatCurrency(
                                                                    Number(
                                                                        relatedDish.basePrice,
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 bg-background border-t border-border/40 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] shrink-0 z-20">
                            <Button
                                className="w-full h-14 text-base font-bold rounded-2xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={
                                    !currentPrice ||
                                    addToCartMutation.isPending ||
                                    (dish.variants &&
                                        dish.variants.length > 0 &&
                                        !matchingSku)
                                }
                            >
                                {addToCartMutation.isPending ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <ShoppingBag className="mr-2 h-5 w-5" />
                                )}
                                <div className="flex flex-1 items-center justify-between px-2">
                                    <span>Thêm vào giỏ</span>
                                    <span className="font-black text-lg">
                                        {currentPrice
                                            ? formatCurrency(
                                                  Number(currentPrice) *
                                                      quantity,
                                              )
                                            : 'Chọn tùy chọn'}
                                    </span>
                                </div>
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
