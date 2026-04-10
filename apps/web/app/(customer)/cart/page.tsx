'use client';

import Link from 'next/link';
import {
    ArrowLeft,
    Minus,
    Plus,
    Trash2,
    ShoppingBag,
    Loader2,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import Image from 'next/image';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/hooks/use-auth';

const Cart = () => {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const utils = trpc.useUtils();

    const { data: cartData, isLoading: isCartLoading } = trpc.cart.get.useQuery(
        undefined,
        {
            enabled: isAuthenticated,
        },
    );

    const updateItemMutation = trpc.cart.update.useMutation({
        onSuccess: () => {
            utils.cart.get.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể cập nhật giỏ hàng');
        },
    });

    const removeItemMutation = trpc.cart.remove.useMutation({
        onSuccess: () => {
            utils.cart.get.invalidate();
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        },
        onError: (error) => {
            toast.error(error.message || 'Không thể xóa sản phẩm');
        },
    });

    const updateQuantity = (
        itemId: string,
        currentQty: number,
        delta: number,
    ) => {
        const newQuantity = currentQty + delta;
        if (newQuantity < 1) return;

        updateItemMutation.mutate({
            itemId,
            quantity: newQuantity,
        });
    };

    const removeItem = (itemId: string) => {
        removeItemMutation.mutate({ itemId });
    };

    if (isAuthLoading || (isAuthenticated && isCartLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-background pt-24 pb-12 flex flex-col items-center justify-center text-center px-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-6" />
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    Bạn chưa đăng nhập
                </h2>
                <p className="text-muted-foreground mb-8">
                    Vui lòng đăng nhập để xem giỏ hàng của bạn
                </p>
                <Link href="/auth/login">
                    <Button variant="hero">Đăng nhập ngay</Button>
                </Link>
            </div>
        );
    }

    const cartItems = cartData?.items || [];
    const subtotal = cartData?.total || 0;
    // Backend cart usually returns total price, but sometimes we re-calc on frontend or rely on backend response.
    // The Schema GetCartResSchema usually has totalPrice.
    // Let's assume cartData has totalPrice, if not we calculate.

    // Delivery fee logic might be frontend or backend.
    // For now simple logic as before.
    const deliveryFee = subtotal > 100000 ? 0 : 15000;
    const total = subtotal + deliveryFee;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <header className="bg-secondary/50 border-b border-border">
                    <div className="container mx-auto px-4 py-16">
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                            Giỏ Hàng
                        </h1>
                    </div>
                </header>

                <div className="container mx-auto px-4 py-24 text-center">
                    <ShoppingBag className="w-24 h-24 text-muted-foreground/30 mx-auto mb-6" />
                    <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                        Giỏ hàng trống
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Hãy thêm một vài món bánh mì ngon vào giỏ hàng của bạn
                    </p>
                    <Link href="/menu">
                        <Button variant="hero">Xem thực đơn</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">

            <header className="bg-secondary/50 border-b border-border">
                <div className="container mx-auto px-4 py-16">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                        Giỏ Hàng
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        {cartItems.length} sản phẩm trong giỏ hàng
                    </p>
                </div>
            </header>


            <main className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item: any) => {
                            // Correctly accessing nested properties based on typical Prisma include structure
                            // Check CartItemSchema: usually has sku -> dish -> dishTranslations & images
                            const dishName =
                                item.sku?.dish?.dishTranslations?.[0]?.name ||
                                'Món ăn';
                            const image =
                                item.sku?.dish?.images?.[0] ||
                                '/images/placeholder-dish.jpg';
                            const price = Number(item.sku?.price || 0);

                            return (
                                <div
                                    key={item.id}
                                    className="flex gap-4 bg-card p-4 rounded-2xl border border-border"
                                >
                                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative bg-muted">
                                        <Image
                                            src={image}
                                            alt={dishName}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-display font-bold text-foreground truncate">
                                            {dishName}
                                        </h3>
                                        {item.sku?.name &&
                                            item.sku.name !== 'Default' && (
                                                <p className="text-sm text-muted-foreground">
                                                    {item.sku.name}
                                                </p>
                                            )}
                                        <p className="text-primary font-medium mt-1">
                                            {formatPrice(price)}
                                        </p>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity,
                                                            -1,
                                                        )
                                                    }
                                                    disabled={
                                                        updateItemMutation.isPending
                                                    }
                                                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            item.id,
                                                            item.quantity,
                                                            1,
                                                        )
                                                    }
                                                    disabled={
                                                        updateItemMutation.isPending
                                                    }
                                                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors disabled:opacity-50"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    removeItem(item.id)
                                                }
                                                disabled={
                                                    removeItemMutation.isPending
                                                }
                                                className="text-muted-foreground hover:text-chili transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        <Link
                            href="/menu"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Tiếp tục mua sắm
                        </Link>
                    </div>


                    <div className="lg:col-span-1">
                        <div className="bg-card p-6 rounded-2xl border border-border sticky top-24">
                            <h2 className="font-display text-xl font-bold text-foreground mb-6">
                                Tóm tắt đơn hàng
                            </h2>

                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Phí giao hàng</span>
                                    <span>
                                        {deliveryFee === 0 ? (
                                            <span className="text-herb">
                                                Miễn phí
                                            </span>
                                        ) : (
                                            formatPrice(deliveryFee)
                                        )}
                                    </span>
                                </div>
                                {subtotal < 100000 && (
                                    <p className="text-xs text-muted-foreground">
                                        Miễn phí giao hàng cho đơn từ{' '}
                                        {formatPrice(100000)}
                                    </p>
                                )}
                                <div className="h-px bg-border" />
                                <div className="flex justify-between font-bold text-foreground text-lg">
                                    <span>Tổng cộng</span>
                                    <span className="text-primary">
                                        {formatPrice(total)}
                                    </span>
                                </div>
                            </div>

                            <Link href="/checkout">
                                <Button
                                    variant="hero"
                                    className="w-full"
                                    size="lg"
                                >
                                    Tiến hành thanh toán
                                </Button>
                            </Link>

                            <p className="text-xs text-muted-foreground text-center mt-4">
                                Thanh toán an toàn và bảo mật
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Cart;
