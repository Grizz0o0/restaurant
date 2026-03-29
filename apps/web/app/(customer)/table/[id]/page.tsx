'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/shared/ui/button';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/shared/ui/sheet';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Badge } from '@/shared/ui/badge';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';
import { Loader2, Minus, Plus, UtensilsCrossed, ChefHat } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

interface CartItem {
    dishId: string;
    dishName: string;
    price: number;
    quantity: number;
    image?: string;
}

export default function GuestTablePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const tableId = params.id as string;
    const token = searchParams.get('token');

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const loginMutation = trpc.auth.guestLogin.useMutation({
        onSuccess: async (data) => {
            // Set cookies via API route
            try {
                await fetch('/api/auth/guest-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        accessToken: data.accessToken,
                        refreshToken: data.refreshToken || data.accessToken,
                    }),
                });
                setIsLoggedIn(true);
                toast.success('Xin chào! Bạn đã kết nối với bàn ăn.');
                refetchDishes();
            } catch (error) {
                toast.error('Lỗi kết nối');
            }
        },
        onError: (err) => {
            toast.error('Lỗi kết nối bàn: ' + err.message);
        },
    });

    const createOrderMutation = trpc.order.create.useMutation({
        onSuccess: (data) => {
            toast.success('Đã gửi gọi món thành công!');
            setCart([]);
            setIsCartOpen(false);
        },
        onError: (err) => {
            toast.error('Gửi gọi món thất bại: ' + err.message);
        },
    });

    const {
        data: dishesData,
        refetch: refetchDishes,
        isLoading,
    } = trpc.dish.list.useQuery(
        {
            page: 1,

            limit: 500,
        },
        {
            enabled: isLoggedIn,
        },
    );

    useEffect(() => {
        if (token && tableId && !isLoggedIn) {
            loginMutation.mutate({ tableId, token });
        }
    }, [token, tableId]);

    const addToCart = (dish: any) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.dishId === dish.id);
            if (existing) {
                return prev.map((item) =>
                    item.dishId === dish.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                );
            }
            return [
                ...prev,
                {
                    dishId: dish.id,
                    dishName: dish.name,
                    price: Number(dish.basePrice),
                    quantity: 1,

                    image: dish.images?.[0],
                },
            ];
        });
        toast.success(`Đã thêm ${dish.name}`, { duration: 1500 });
    };

    const updateQuantity = (dishId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.dishId === dishId) {
                        const newQty = item.quantity + delta;
                        if (newQty <= 0) return null as any;
                        return { ...item, quantity: newQty };
                    }
                    return item;
                })
                .filter(Boolean);
        });
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        createOrderMutation.mutate({
            tableId,
            items: cart.map((item) => ({
                dishId: item.dishId,
                quantity: item.quantity,
            })),
        });
    };

    const totalPrice = useMemo(
        () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [cart],
    );

    const totalItems = useMemo(
        () => cart.reduce((acc, item) => acc + item.quantity, 0),
        [cart],
    );

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full">
                    <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        Thiếu thông tin bàn
                    </h2>
                    <p className="text-gray-500">
                        Vui lòng quét lại mã QR được dán trên bàn để bắt đầu gọi
                        món.
                    </p>
                </div>
            </div>
        );
    }

    if (loginMutation.isPending && !isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground animate-pulse">
                    Đang kết nối vào bàn...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-32">
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b shadow-xs">
                <div className="container max-w-md mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-1.5 rounded-lg">
                            <ChefHat className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-bold text-lg text-foreground">
                            BAMIXO
                        </span>
                    </div>
                    {/* Placeholder for table number if available in future */}
                    <Badge variant="secondary" className="font-mono text-xs">
                        Bàn {tableId.slice(0, 4)}...
                    </Badge>
                </div>
                {/* Horizontal Category Scroll */}
                {/* <div className="border-t">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex w-max space-x-4 p-3">
                            {['Món Mới', 'Bán Chạy', 'Món Chính', 'Đồ Uống', 'Tráng Miệng'].map((cat) => (
                                <button key={cat} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div> */}
            </header>

            <main className="container max-w-md mx-auto p-4 space-y-6">
                <div className="bg-linear-to-r from-primary to-primary/80 rounded-2xl p-6 text-white shadow-lg shadow-primary/20">
                    <h1 className="text-2xl font-bold mb-1">
                        Xin chào thực khách!
                    </h1>
                    <p className="opacity-90 text-sm">
                        Chúc bạn có một bữa ăn ngon miệng.
                    </p>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-32 bg-gray-100/50 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {dishesData?.data.map((dish: any) => (
                            <div
                                key={dish.id}
                                className="group bg-white rounded-xl border border-dashed hover:border-solid border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                <div className="aspect-4/3 relative bg-gray-100 w-full">
                                    {dish.images?.[0] ? (
                                        <>
                                            <Image
                                                src={dish.images[0]}
                                                alt={dish.name}
                                                fill
                                                className={cn(
                                                    'object-cover transition-transform duration-500',
                                                    dish.isAvailable !== false
                                                        ? 'group-hover:scale-110'
                                                        : 'grayscale opacity-70',
                                                )}
                                            />
                                            {dish.isAvailable === false && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                                    <Badge
                                                        variant="destructive"
                                                        className="shadow-lg uppercase tracking-wide px-3 py-1"
                                                    >
                                                        Tạm hết hàng
                                                    </Badge>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                            <UtensilsCrossed className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 p-3 flex flex-col justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-2 text-sm leading-tight h-10">
                                            {dish.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">
                                            {dish.description ||
                                                'Món ăn thơm ngon, hấp dẫn...'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 mt-auto border-t border-gray-50">
                                        <span className="font-bold text-primary text-sm">
                                            {formatCurrency(
                                                Number(dish.basePrice),
                                            )}
                                        </span>
                                        <Button
                                            size="icon"
                                            className={cn(
                                                'h-8 w-8 rounded-full shadow-sm shrink-0',
                                                dish.isAvailable === false &&
                                                    'opacity-50',
                                            )}
                                            onClick={() => addToCart(dish)}
                                            disabled={
                                                dish.isAvailable === false
                                            }
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none">
                    <div className="container max-w-md mx-auto pointer-events-auto">
                        <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                            <SheetTrigger asChild>
                                <div
                                    className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                                    onClick={() => setIsCartOpen(true)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center font-bold">
                                            {totalItems}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium opacity-90">
                                                Tổng tiền
                                            </span>
                                            <span className="font-bold text-lg leading-none">
                                                {formatCurrency(totalPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="font-bold"
                                    >
                                        Xem giỏ hàng
                                    </Button>
                                </div>
                            </SheetTrigger>
                            <SheetContent
                                side="bottom"
                                className="rounded-t-3xl max-h-[85vh] flex flex-col p-0"
                            >
                                <SheetHeader className="p-6 pb-2 border-b">
                                    <SheetTitle>Giỏ hàng của bạn</SheetTitle>
                                </SheetHeader>

                                <ScrollArea className="flex-1 p-6">
                                    {cart.length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground">
                                            Giỏ hàng đang trống
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {cart.map((item) => (
                                                <div
                                                    key={item.dishId}
                                                    className="flex gap-4"
                                                >
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg relative overflow-hidden shrink-0">
                                                        {item.image ? (
                                                            <Image
                                                                src={item.image}
                                                                alt={
                                                                    item.dishName
                                                                }
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <UtensilsCrossed className="w-6 h-6" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-medium text-sm">
                                                            {item.dishName}
                                                        </h4>
                                                        <p className="text-sm text-primary font-bold">
                                                            {formatCurrency(
                                                                item.price,
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 h-fit">
                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 active:scale-95 transition-all"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.dishId,
                                                                    -1,
                                                                )
                                                            }
                                                        >
                                                            <Minus className="w-4 h-4" />
                                                        </button>
                                                        <span className="font-medium text-sm min-w-4 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-primary active:scale-95 transition-all"
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item.dishId,
                                                                    1,
                                                                )
                                                            }
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="p-6 border-t bg-gray-50/50 space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">
                                            Tạm tính
                                        </span>
                                        <span className="font-medium">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center text-lg font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">
                                            {formatCurrency(totalPrice)}
                                        </span>
                                    </div>
                                    <Button
                                        className="w-full h-12 text-base shadow-lg shadow-primary/25"
                                        onClick={handleCheckout}
                                        disabled={
                                            createOrderMutation.isPending ||
                                            cart.length === 0
                                        }
                                    >
                                        {createOrderMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Đang gửi yêu cầu...
                                            </>
                                        ) : (
                                            'Xác nhận gọi món'
                                        )}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            )}
        </div>
    );
}
