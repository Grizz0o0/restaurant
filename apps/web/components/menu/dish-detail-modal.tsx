'use client';

import { useEffect, useState } from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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

    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >({});

    const { data: dish, isLoading } = trpc.dish.detail.useQuery(
        { id: dishId as string },
        {
            enabled: !!dishId && isOpen,
        },
    );

    useEffect(() => {
        if (!isOpen) {
            setQuantity(1);
            setSelectedOptions({});
        }
    }, [isOpen]);

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

    const addToCartMutation = trpc.cart.add.useMutation({
        onSuccess: () => {
            toast.success(`Đã thêm ${quantity} ${dishName} vào giỏ`, {
                position: 'top-center',
            });
            trackInteraction('ADD_CART', dishId as string, {
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
            <DialogContent className="sm:max-w-105 p-0 flex flex-col gap-0 overflow-hidden max-h-[90vh] rounded-3xl">
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
                            <DialogHeader className="p-0 text-left space-y-0">
                                <div className="relative w-full aspect-square sm:aspect-4/3 bg-muted/30 shrink-0 isolate">
                                    {dish.images?.[0] ? (
                                        <Image
                                            src={dish.images[0]}
                                            alt={dish.name || 'Dish'}
                                            fill
                                            className="object-cover"
                                            priority
                                            sizes="(max-width: 640px) 100vw, 420px"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gray-50 dark:bg-zinc-900 border-b">
                                            <span className="text-sm font-medium">
                                                Không có ảnh
                                            </span>
                                        </div>
                                    )}

                                    {/* Premium Gradient Overlay */}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

                                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                        <DialogTitle
                                            className={
                                                dishName
                                                    ? 'text-2xl md:text-[28px] leading-tight font-display font-bold text-white tracking-tight drop-shadow-sm'
                                                    : 'sr-only'
                                            }
                                        >
                                            {dishName || 'Chi tiết món ăn'}
                                        </DialogTitle>
                                        <div className="text-white/95 font-semibold text-lg md:text-xl mt-1.5 drop-shadow-sm flex items-center gap-2 text-primary-200">
                                            {currentPrice
                                                ? formatCurrency(
                                                      Number(currentPrice),
                                                  )
                                                : ''}
                                        </div>
                                    </div>
                                </div>

                                {dishDescription && (
                                    <div className="px-6 pt-6 pb-2">
                                        <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground/90 whitespace-pre-line font-medium">
                                            {dishDescription}
                                        </DialogDescription>
                                    </div>
                                )}
                            </DialogHeader>

                            <div className="space-y-7 p-6 pt-4">
                                {/* Variants */}
                                {dish.variants?.map((variant: any) => (
                                    <div
                                        key={variant.id}
                                        className="space-y-3.5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base font-semibold text-foreground tracking-tight">
                                                {variant.name}
                                            </Label>
                                            <span className="text-[11px] uppercase tracking-wider font-bold text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
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
                                            className="flex flex-wrap gap-2.5"
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
                                                            className="flex items-center justify-center rounded-2xl border border-transparent bg-muted/50 px-5 py-2.5 text-[15px] font-medium text-muted-foreground hover:bg-muted/80 peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground peer-data-[state=checked]:shadow-md cursor-pointer transition-all duration-200 select-none"
                                                        >
                                                            {option.value}
                                                        </Label>
                                                    </div>
                                                ),
                                            )}
                                        </RadioGroup>
                                    </div>
                                ))}

                                {/* Quantity */}
                                <div className="flex items-center justify-between pt-6 border-t border-border/60">
                                    <span className="font-semibold text-base tracking-tight text-foreground">
                                        Số lượng
                                    </span>
                                    <div className="flex items-center gap-4 bg-muted/40 rounded-full p-1 border shadow-sm">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm text-foreground/80 hover:text-foreground transition-all"
                                            onClick={() =>
                                                setQuantity(
                                                    Math.max(1, quantity - 1),
                                                )
                                            }
                                            disabled={quantity <= 1}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-6 text-center font-semibold text-[17px]">
                                            {quantity}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full hover:bg-background hover:shadow-sm text-foreground/80 hover:text-foreground transition-all"
                                            onClick={() =>
                                                setQuantity(quantity + 1)
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 sm:p-5 bg-background border-t shadow-[0_-12px_40px_-15px_rgba(0,0,0,0.15)] shrink-0 z-20">
                            <Button
                                className="w-full h-14 text-[16px] font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
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
                                ) : null}
                                <div className="flex items-center justify-between w-full px-2">
                                    <span>Thêm vào giỏ</span>
                                    <span className="font-black text-[17px]">
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
