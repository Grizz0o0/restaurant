'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/domain/use-auth';
import { useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Archive, BarChart3, ShoppingBag, Users } from 'lucide-react';
import { OrderStatusBadge } from '@/components/admin/orders/order-status-badge';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

// --- Revenue Chart Component ---
function RevenueChart({
    formatCurrency,
}: {
    formatCurrency: (v: number) => string;
}) {
    // useMemo để tránh tạo Date mới mỗi render → React Query không bị re-fetch liên tục
    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { startDate: start, endDate: end };
    }, []); // [] = chỉ tính 1 lần khi mount

    const { data, isLoading } = trpc.admin.getReport.useQuery({
        startDate,
        endDate,
    });

    // Build a full 7-day array, filling in 0 for days with no orders
    const chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];
        const found = data?.dailyRevenue?.find((r) => r.date === dateKey);
        return {
            date: d.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
            }),
            revenue: found?.revenue ?? 0,
            orders: found?.orders ?? 0,
        };
    });

    if (isLoading) {
        return (
            <div className="h-88 flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Đang tải...</p>
            </div>
        );
    }

    const hasData = chartData.some((d) => d.revenue > 0);

    if (!hasData) {
        return (
            <div className="h-88 flex items-center justify-center bg-muted/20 rounded-md border border-dashed">
                <p className="text-muted-foreground text-sm">
                    Chưa có dữ liệu 7 ngày qua
                </p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={350}>
            <AreaChart
                data={chartData}
                margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
            >
                <defs>
                    <linearGradient
                        id="revenueGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                        />
                        <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                />
                <YAxis
                    tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()
                    }
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    className="fill-muted-foreground"
                />
                <Tooltip
                    formatter={(value: number | undefined) => [
                        formatCurrency(value ?? 0),
                        'Doanh thu',
                    ]}
                    labelFormatter={(label) => `Ngày ${label}`}
                    contentStyle={{
                        borderRadius: '8px',
                        fontSize: '13px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        color: 'hsl(var(--card-foreground))',
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                    activeDot={{ r: 6 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

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

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Doanh thu gần đây</CardTitle>
                        <CardDescription>
                            Biểu đồ doanh thu 7 ngày qua
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <RevenueChart formatCurrency={formatCurrency} />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
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
