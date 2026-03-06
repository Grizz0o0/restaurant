'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/domain/use-auth';
import { trpc } from '@/lib/trpc/client';
import { Archive, BarChart3, ShoppingBag, Users } from 'lucide-react';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';

export default function AdminDashboard() {
    const { user } = useAuth();
    const { data: stats, isLoading } = trpc.admin.getStats.useQuery();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(value);
    };

    const dashboardStats = [
        {
            title: 'Tổng doanh thu',
            value: isLoading ? '...' : formatCurrency(stats?.totalRevenue || 0),
            description: isLoading
                ? '...'
                : `Hôm nay: ${formatCurrency(stats?.todaysRevenue || 0)}`,
            icon: BarChart3,
            color: 'text-green-600',
        },
        {
            title: 'Đơn hàng',
            value: isLoading ? '...' : stats?.totalOrders,
            description: isLoading
                ? '...'
                : `${stats?.newOrdersToday || 0} đơn mới hôm nay`,
            icon: ShoppingBag,
            color: 'text-blue-600',
        },
        {
            title: 'Khách hàng',
            value: isLoading ? '...' : stats?.totalCustomers,
            description: 'Tổng số khàng hàng đăng ký',
            icon: Users,
            color: 'text-orange-600',
        },
        {
            title: 'Món ăn',
            value: isLoading ? '...' : stats?.activeDishes,
            description: 'Đang kinh doanh',
            icon: Archive,
            color: 'text-purple-600',
        },
    ];

    return (
        <div className="space-y-6 px-4 md:px-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
                <p className="text-muted-foreground">
                    Chào mừng trở lại, {user?.name}. Đây là tình hình kinh doanh
                    hôm nay.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {dashboardStats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Doanh thu gần đây</CardTitle>
                        <CardDescription>
                            Biểu đồ doanh thu 7 ngày qua
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-50 flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                            <p className="text-muted-foreground text-sm">
                                Chưa có dữ liệu biểu đồ
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Hoạt động gần đây</CardTitle>
                        <CardDescription>Các đơn hàng mới nhất</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isLoading ? (
                                <p className="text-sm text-muted-foreground">
                                    Đang tải...
                                </p>
                            ) : stats?.recentOrders.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Chưa có đơn hàng nào
                                </p>
                            ) : (
                                stats?.recentOrders.map((order: any) => (
                                    <div
                                        key={order.id}
                                        className="flex items-center gap-4 group p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <ShoppingBag className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                {order.user}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {order.itemsSummary}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <div className="text-sm font-semibold whitespace-nowrap">
                                                {formatCurrency(
                                                    order.totalAmount,
                                                )}
                                            </div>
                                            <OrderStatusBadge
                                                status={order.status}
                                                className="scale-90 origin-right"
                                                showIcon={false}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
