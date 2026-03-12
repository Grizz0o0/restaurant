'use client';

import { trpc } from '@/lib/trpc/client';
import { usePosStore } from '@/store/pos-store';
import {
    ClipboardList,
    Loader2,
    ChefHat,
    CheckCircle2,
    Clock,
    Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    CONFIRMED: {
        label: 'Đã xác nhận',
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        icon: <ChefHat className="h-3 w-3" />,
    },
    PROCESSING: {
        label: 'Đang chế biến',
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <ChefHat className="h-3 w-3" />,
    },
    DELIVERED: {
        label: 'Đã phục vụ',
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle2 className="h-3 w-3" />,
    },
};

interface TableOrderPanelProps {
    tableId: string;
    tableName: string;
}

export function TableOrderPanel({ tableId, tableName }: TableOrderPanelProps) {
    const { data, isLoading, refetch } = trpc.order.list.useQuery(
        {
            page: 1,
            limit: 20,
            tableId,
            // Only show active (non-completed) orders
            status: undefined,
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

    const activeOrders = (data?.data || []).filter((order) =>
        [
            'PENDING_CONFIRMATION',
            'CONFIRMED',
            'PROCESSING',
            'DELIVERED',
        ].includes(order.status),
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

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Đơn tại {tableName}
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
                            <span className="text-xs font-mono text-muted-foreground">
                                #{order.id.slice(-8).toUpperCase()}
                            </span>
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
                                        {formatVnd(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/10">
                            <span className="text-sm font-bold">
                                {formatVnd(order.totalAmount)}
                            </span>
                            {order.status === 'PENDING_CONFIRMATION' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                        updateStatusMutation.mutate({
                                            orderId: order.id,
                                            status: 'CONFIRMED',
                                        })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                >
                                    Xác nhận
                                </Button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
