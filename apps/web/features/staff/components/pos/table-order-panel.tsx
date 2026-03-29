'use client';

import { trpc } from '@/lib/trpc/client';
import { usePosStore } from '@/state/pos-store';
import {
    ClipboardList,
    Loader2,
    ChefHat,
    CheckCircle2,
    Clock,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { toast } from 'sonner';

const statusConfig: Record<
    string,
    { label: string; color: string; icon: React.ReactNode }
> = {
    PENDING_CONFIRMATION: {
        label: 'Chờ xác nhận',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
    },
    PREPARING: {
        label: 'Đang chế biến',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <ChefHat className="h-3 w-3" />,
    },
    DELIVERED: {
        label: 'Đã phục vụ',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
    READY_FOR_PICKUP: {
        label: 'Sẵn sàng',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
};

interface TableOrderPanelProps {
    tableId?: string;
    tableName?: string;
    onPayment?: (orderIds: string[], total: number, tableName: string) => void;
}

export function TableOrderPanel({
    tableId,
    tableName,
    onPayment,
}: TableOrderPanelProps) {
    const { data, isLoading, refetch } = trpc.order.list.useQuery(
        {
            page: 1,
            limit: 20,
            tableId: tableId || undefined,
            // If tableId is not provided, we want to fetch takeaway orders (NULL tableId)
            // But the current API might need a specific filter for NULL.
            // Let's assume sending undefined tableId in the TRPC query means "all"
            // or we might need a specific "isTakeaway" filter.
        },
        {
            refetchInterval: 10000, // auto-refresh every 10s
        },
    );

    const utils = trpc.useUtils();
    const updateStatusMutation = trpc.order.updateStatus.useMutation({
        onSuccess: () => {
            toast.success('Cập nhật trạng thái đơn thành công!');
            utils.order.list.invalidate();
            utils.table.list.invalidate();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const activeOrders = (data?.data || []).filter(
        (order) =>
            [
                'PENDING_CONFIRMATION',
                'PREPARING',
                'READY_FOR_PICKUP',
                'DELIVERED',
            ].includes(order.status) && !order.addressId,
    );

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (activeOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground opacity-60">
                <ClipboardList className="h-10 w-10 mb-3" />
                <p className="text-sm font-medium">Chưa có đơn nào</p>
                <p className="text-xs mt-1">Thêm món để tạo đơn mới</p>
            </div>
        );
    }

    const activeTableTotal = activeOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0,
    );
    const activeOrderIds = activeOrders.map((o) => o.id);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    {tableId ? `Đơn tại ${tableName}` : 'Đơn Mang Về'}
                </h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => refetch()}
                >
                    Làm mới
                </Button>
            </div>

            <div className="space-y-3">
                {activeOrders.map((order) => {
                    const status = statusConfig[order.status] ?? {
                        label: order.status,
                        color: 'bg-gray-100 text-gray-700',
                        icon: null,
                    };

                    return (
                        <div
                            key={order.id}
                            className="bg-background border rounded-xl overflow-hidden shadow-sm"
                        >
                            {/* Order Header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-primary uppercase">
                                        {order.addressId
                                            ? '🛵 Giao hàng'
                                            : '🛍️ Mang về'}
                                    </span>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        #{order.id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <span
                                    className={cn(
                                        'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border',
                                        status.color,
                                    )}
                                >
                                    {status.icon}
                                    {status.label}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="px-3 py-2 space-y-1.5">
                                {order.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex justify-between text-sm"
                                    >
                                        <span className="text-foreground flex-1 truncate">
                                            <span className="font-medium text-primary mr-1.5">
                                                x{item.quantity}
                                            </span>
                                            {item.dishName}
                                        </span>
                                        <span className="text-muted-foreground ml-2 shrink-0">
                                            {formatVnd(
                                                item.price * item.quantity,
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/10">
                                <span className="text-sm font-bold">
                                    {formatVnd(order.totalAmount)}
                                </span>
                                <div className="flex gap-2">
                                    {order.status ===
                                        'PENDING_CONFIRMATION' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                            onClick={() =>
                                                updateStatusMutation.mutate({
                                                    orderId: order.id,
                                                    status: 'PREPARING',
                                                })
                                            }
                                            disabled={
                                                updateStatusMutation.isPending
                                            }
                                        >
                                            Xác nhận
                                        </Button>
                                    )}
                                    {/* Individual Payment Button - ONLY for takeaway (no tableId) */}
                                    {order.status !== 'PENDING_CONFIRMATION' &&
                                        !tableId && (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                onClick={() =>
                                                    onPayment?.(
                                                        [order.id],
                                                        order.totalAmount,
                                                        tableName || 'Mang đi',
                                                    )
                                                }
                                            >
                                                Thanh toán
                                            </Button>
                                        )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Overall Table Summary & Merged Payment Button */}
            {tableId && activeOrders.length > 0 && (
                <div className="pt-2 border-t border-dashed space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-medium text-muted-foreground">
                            Tổng cộng ({activeOrders.length} đơn)
                        </span>
                        <span className="text-lg font-black text-primary">
                            {formatVnd(activeTableTotal)}
                        </span>
                    </div>
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 py-6 text-base font-bold shadow-lg"
                        onClick={() =>
                            onPayment?.(
                                activeOrderIds,
                                activeTableTotal,
                                tableName || '',
                            )
                        }
                    >
                        THANH TOÁN TẤT CẢ
                    </Button>
                </div>
            )}
        </div>
    );
}
