'use client';

import { useMemo, useState } from 'react';
import { ShoppingCart, Loader2, Search, Eye } from 'lucide-react';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const ORDER_STATUSES = [
    {
        value: 'PENDING_CONFIRMATION',
        label: 'Chờ xác nhận',
        variant: 'outline' as const,
    },
    {
        value: 'PREPARING',
        label: 'Đang chuẩn bị',
        variant: 'secondary' as const,
    },
    {
        value: 'READY_FOR_PICKUP',
        label: 'Sẵn sàng',
        variant: 'default' as const,
    },
    { value: 'DELIVERING', label: 'Đang giao', variant: 'default' as const },
    { value: 'DELIVERED', label: 'Đã giao', variant: 'default' as const },
    { value: 'COMPLETED', label: 'Hoàn thành', variant: 'default' as const },
    { value: 'CANCELLED', label: 'Đã hủy', variant: 'destructive' as const },
];

export default function AdminOrdersPage() {
    const utils = trpc.useUtils();
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    // Data Fetching
    const { data: ordersData, isLoading } = trpc.order.list.useQuery({
        page: 1,
        limit: 100,
    });

    const orders = ordersData?.data || [];

    const updateStatusMutation = trpc.order.updateStatus.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái đơn hàng');
            utils.order.list.invalidate();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const handleStatusChange = (orderId: string, newStatus: string) => {
        updateStatusMutation.mutate({ orderId, status: newStatus });
    };

    // Filtering Logic
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchStatus =
                filterStatus === 'all' || order.status === filterStatus;
            const matchSearch =
                searchQuery === '' ||
                order.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [orders, filterStatus, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const total = orders.length;
        const pending = orders.filter(
            (o) => o.status === 'PENDING_CONFIRMATION',
        ).length;
        const completed = orders.filter((o) => o.status === 'COMPLETED').length;
        const totalRevenue = orders
            .filter((o) => o.status === 'COMPLETED')
            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        return { total, pending, completed, totalRevenue };
    }, [orders]);

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    const formatDate = (date: any) => {
        try {
            return new Date(date).toLocaleString('vi-VN');
        } catch {
            return '-';
        }
    };

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý đơn hàng
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Theo dõi và cập nhật trạng thái đơn hàng của khách.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => utils.order.list.invalidate()}
                >
                    Làm mới
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Tổng số
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Tổng đơn hàng
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Chờ xác nhận
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.pending}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Đơn chờ xử lý
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Hoàn thành
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.completed}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Đơn đã hoàn thành
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Doanh thu
                        </CardDescription>
                        <CardTitle className="font-display text-2xl">
                            {formatVnd(stats.totalRevenue)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Từ đơn hoàn thành
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Tìm theo mã đơn hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-50">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                                {status.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Orders Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold text-lg">
                                Không tìm thấy đơn hàng
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'Thử thay đổi bộ lọc tìm kiếm'
                                    : 'Chưa có đơn hàng nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Mã đơn
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Trạng thái
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Số món
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Tổng tiền
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Ngày tạo
                                        </th>
                                        <th className="text-right p-4 font-semibold text-sm">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredOrders.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="font-mono text-sm">
                                                    {order.id.slice(0, 8)}...
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Select
                                                    value={order.status}
                                                    onValueChange={(value) =>
                                                        handleStatusChange(
                                                            order.id,
                                                            value,
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-45">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {ORDER_STATUSES.map(
                                                            (status) => (
                                                                <SelectItem
                                                                    key={
                                                                        status.value
                                                                    }
                                                                    value={
                                                                        status.value
                                                                    }
                                                                >
                                                                    {
                                                                        status.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {order.items?.length || 0} món
                                            </td>
                                            <td className="p-4 font-medium">
                                                {formatVnd(
                                                    Number(
                                                        order.totalAmount || 0,
                                                    ),
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setSelectedOrder(
                                                                order,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Detail Dialog */}
            <Dialog
                open={!!selectedOrder}
                onOpenChange={(open) => !open && setSelectedOrder(null)}
            >
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-display text-2xl">
                            Chi tiết đơn hàng
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Mã đơn hàng
                                    </p>
                                    <p className="font-mono">
                                        {selectedOrder.id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Trạng thái
                                    </p>
                                    <div className="mt-1">
                                        <OrderStatusBadge
                                            status={selectedOrder.status}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Tổng tiền
                                    </p>
                                    <p className="font-semibold text-lg">
                                        {formatVnd(
                                            Number(
                                                selectedOrder.totalAmount || 0,
                                            ),
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Ngày tạo
                                    </p>
                                    <p>{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">
                                    Các món đã đặt
                                </h4>
                                <div className="divide-y border rounded-lg">
                                    {selectedOrder.items?.map((item: any) => (
                                        <div
                                            key={item.id}
                                            className="p-3 flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="font-medium">
                                                    {item.dishName}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Số lượng: {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-medium">
                                                {formatVnd(
                                                    Number(item.price || 0),
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
