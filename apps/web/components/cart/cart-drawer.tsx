'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/use-ui-store';
import { formatCurrency } from '@/lib/utils/format';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/domain/use-auth';

export function CartDrawer() {
    const { isCartOpen, setCartOpen } = useUIStore();
    const utils = trpc.useUtils();
    const { user } = useAuth();

    const { data: cart, isLoading } = trpc.cart.get.useQuery(undefined, {
        enabled: isCartOpen && !!user,
    });

    const items = cart?.items || [];
    const totalAmount = cart?.total || 0;

    const updateQuantityMutation = trpc.cart.update.useMutation({
        onSuccess: () => {
            utils.cart.get.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || 'Lỗi cập nhật giỏ hàng');
        },
    });

    const removeItemMutation = trpc.cart.remove.useMutation({
        onSuccess: () => {
            utils.cart.get.invalidate();
            toast.success('Đã xóa sản phẩm khỏi giỏ');
        },
        onError: (error) => {
            toast.error(error.message || 'Lỗi xóa sản phẩm');
        },
    });

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantityMutation.mutate({
            itemId: itemId,
            quantity: newQuantity,
        });
    };

    const handleRemoveItem = (itemId: string) => {
        removeItemMutation.mutate({ itemId });
    };

    return (
        <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
            <SheetContent
                className="w-full sm:max-w-md flex flex-col p-0 gap-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="flex items-center gap-2 text-xl font-display">
                        <ShoppingBag className="w-5 h-5" />
                        Giỏ hàng ({items.length})
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-[50vh]">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">
                                    Giỏ hàng trống
                                </h3>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Hãy thêm vài món ngon vào đây nhé!
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link
                                    href="/menu"
                                    onClick={() => setCartOpen(false)}
                                >
                                    Tiếp tục xem menu
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 items-start animate-fade-in"
                                >
                                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border">
                                        {item.sku.dish.images?.[0] ? (
                                            <Image
                                                src={item.sku.dish.images[0]}
                                                alt={
                                                    item.sku.dish.name || 'Item'
                                                }
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                                No img
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-sm line-clamp-2">
                                                {item.sku.dish.name}
                                            </h4>
                                            <button
                                                onClick={() =>
                                                    handleRemoveItem(item.id)
                                                }
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                disabled={
                                                    removeItemMutation.isPending
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Display variant info if available - assuming sku.value holds this or we need to parse it */}
                                        {/* The API returns `sku.value` which might be the variant string or we construct it manually if needed. 
                                            For now, just showing sku.value if it differs from default/empty */}

                                        <p className="text-xs text-muted-foreground mb-2">
                                            {item.sku.value}
                                        </p>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.id,
                                                            item.quantity - 1,
                                                        )
                                                    }
                                                    disabled={
                                                        updateQuantityMutation.isPending ||
                                                        item.quantity <= 1
                                                    }
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </Button>
                                                <span className="text-sm font-medium w-4 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full"
                                                    onClick={() =>
                                                        handleUpdateQuantity(
                                                            item.id,
                                                            item.quantity + 1,
                                                        )
                                                    }
                                                    disabled={
                                                        updateQuantityMutation.isPending
                                                    }
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <span className="font-semibold text-sm">
                                                {formatCurrency(
                                                    (item.sku.price || 0) *
                                                        item.quantity,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="p-6 border-t bg-background space-y-4">
                        <div className="flex items-center justify-between text-base">
                            <span className="text-muted-foreground">
                                Tạm tính
                            </span>
                            <span className="font-bold text-lg">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            variant="hero"
                            asChild
                        >
                            <Link
                                href="/checkout"
                                onClick={() => setCartOpen(false)}
                            >
                                Thanh toán ngay
                            </Link>
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
