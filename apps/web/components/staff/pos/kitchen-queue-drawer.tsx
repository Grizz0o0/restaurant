'use client';

import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChefHat, Loader2, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';

export function KitchenQueueDrawer() {
    const [open, setOpen] = useState(false);
    const utils = trpc.useUtils();

    // Fetch all active orders
    const { data: ordersData, isLoading } = trpc.order.list.useQuery(
        { page: 1, limit: 100 },
        {
            enabled: open,
            refetchInterval: open ? 5000 : false, // Auto refresh every 5s when open
        },
    );

    const activeOrders = (ordersData?.data || []).filter((o) =>
        ['PENDING_CONFIRMATION', 'PREPARING'].includes(o.status),
    );

    // Group items from all active orders to show a unified kitchen view
    // A more advanced KDS would have individual item status, but since the schema
    // currently only has status at the Order level, we will display orders that need preparing.

    // Total items waiting
    const pendingItemsCount = activeOrders.reduce(
        (sum, order) => sum + (order.items?.length || 0),
        0,
    );

    const updateStatusMutation = trpc.order.updateStatus.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái món thành công');
            utils.order.list.invalidate();
        },
        onError: (err) => {
            toast.error(`Lỗi cập nhật: ${err.message}`);
        },
    });

    const markAsReady = (orderId: string) => {
        updateStatusMutation.mutate({ orderId, status: 'READY_FOR_PICKUP' });
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="relative border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 font-semibold h-9"
                >
                    <ChefHat className="w-4 h-4 mr-2" />
                    Chờ bếp
                    {/* Notification Dot - simplified to always ping if there are any active orders, even when real polling isn't on */}
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] text-white items-center justify-center font-bold">
                            !
                        </span>
                    </span>
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-100 sm:w-125 p-0 flex flex-col"
            >
                <SheetHeader className="p-4 border-b bg-muted/30">
                    <SheetTitle className="flex items-center gap-2 font-display text-xl">
                        <ChefHat className="h-6 w-6 text-primary" />
                        Danh sách chờ Bếp
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Hiện có {pendingItemsCount} món từ {activeOrders.length}{' '}
                        đơn đang chờ chế biến.
                    </p>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center flex-col gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p>Đang tải dữ liệu bếp...</p>
                        </div>
                    ) : activeOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                            <p className="text-lg font-medium">
                                Bếp đang rảnh rang!
                            </p>
                            <p className="text-sm">
                                Không có đơn hàng nào đang chờ.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-background border rounded-lg shadow-sm overflow-hidden"
                                >
                                    <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-md text-sm">
                                                {(order as any).table?.name ||
                                                    'Mang đi'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                #
                                                {order.id
                                                    .slice(-6)
                                                    .toUpperCase()}
                                            </div>
                                        </div>
                                        <OrderStatusBadge
                                            status={order.status}
                                        />
                                    </div>

                                    <div className="p-0">
                                        <ul className="divide-y text-sm">
                                            {order.items?.map((item) => (
                                                <li
                                                    key={item.id}
                                                    className="p-3 flex items-start gap-3"
                                                >
                                                    <div className="font-bold text-lg leading-none mt-0.5 min-w-6">
                                                        {item.quantity}x
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold">
                                                            {item.dishName}
                                                        </p>
                                                        {(item as any).note && (
                                                            <p className="text-rose-600 bg-rose-50 px-2 py-1 mt-1 rounded text-xs inline-block font-medium italic border border-rose-200">
                                                                * Note:{' '}
                                                                {
                                                                    (
                                                                        item as any
                                                                    ).note
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-3 border-t bg-muted/10 flex justify-end">
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                            onClick={() =>
                                                markAsReady(order.id)
                                            }
                                            disabled={
                                                updateStatusMutation.isPending
                                            }
                                        >
                                            {updateStatusMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                            )}
                                            Bếp đã nấu xong
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
