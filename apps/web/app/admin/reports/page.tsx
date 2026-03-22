'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {
    Download,
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Award,
    ThumbsUp,
    ThumbsDown,
    Star,
    Loader2,
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';

const PRESET_RANGES = [
    { label: '7 ngày qua', value: '7d' },
    { label: '30 ngày qua', value: '30d' },
    { label: 'Tháng này', value: 'thisMonth' },
    { label: '3 tháng qua', value: '90d' },
    { label: 'Năm nay', value: 'thisYear' },
];

function getDateRange(preset: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    switch (preset) {
        case '7d':
            return { startDate: subDays(now, 6), endDate: now };
        case '30d':
            return { startDate: subDays(now, 29), endDate: now };
        case 'thisMonth':
            return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
        case '90d':
            return { startDate: subDays(now, 89), endDate: now };
        case 'thisYear':
            return {
                startDate: new Date(now.getFullYear(), 0, 1),
                endDate: now,
            };
        default:
            return { startDate: subDays(now, 6), endDate: now };
    }
}

const formatVnd = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);

const formatVndFull = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);

// Custom Tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // label is already a pre-formatted "dd/MM" string — use it directly
        return (
            <div className="bg-background border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                <p className="text-emerald-600">
                    Doanh thu: {formatVndFull(payload[0]?.value || 0)}
                </p>
                <p className="text-blue-600">
                    Đơn hàng: {payload[1]?.value || 0}
                </p>
            </div>
        );
    }
    return null;
};

export default function AdminReportsPage() {
    const [preset, setPreset] = useState('30d');
    const { startDate, endDate } = useMemo(
        () => getDateRange(preset),
        [preset],
    );

    const { data, isLoading } = trpc.admin.getReport.useQuery(
        { startDate, endDate },
        { refetchOnWindowFocus: false },
    );

    const handleExportExcel = () => {
        if (!data) return;

        // Build the workbook
        const wb = XLSX.utils.book_new();

        // --- Sheet 1: Daily Revenue ---
        const revenueRows = [
            ['Ngày', 'Doanh thu (VND)', 'Số đơn hàng'],
            ...data.dailyRevenue.map((row) => [
                row.date,
                row.revenue,
                row.orders,
            ]),
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(revenueRows);
        // Set column widths
        ws1['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Doanh thu theo ngày');

        // --- Sheet 2: Top Dishes ---
        const dishRows = [
            ['#', 'Tên món ăn', 'Số lượng bán', 'Doanh thu (VND)'],
            ...data.topDishes.map((d, i) => [
                i + 1,
                d.dishName,
                d.totalQuantity,
                d.totalRevenue,
            ]),
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(dishRows);
        ws2['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 16 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Món bán chạy');

        // --- Sheet 3: Top Rated Dishes ---
        const topRatedRows = [
            ['#', 'Tên món ăn', 'Điểm trung bình', 'Số lượt đánh giá'],
            ...data.topRatedDishes.map((d, i) => [
                i + 1,
                d.dishName,
                d.avgRating,
                d.reviewCount,
            ]),
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(topRatedRows);
        ws3['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 15 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Top Khen (Điểm cao)');

        // --- Sheet 4: Top Criticized Dishes ---
        const topCriticizedRows = [
            ['#', 'Tên món ăn', 'Điểm trung bình', 'Số lượt đánh giá'],
            ...data.topCriticizedDishes.map((d, i) => [
                i + 1,
                d.dishName,
                d.avgRating,
                d.reviewCount,
            ]),
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(topCriticizedRows);
        ws4['!cols'] = [{ wch: 4 }, { wch: 30 }, { wch: 15 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Top Chê (Điểm thấp)');

        XLSX.writeFile(
            wb,
            `bao-cao-${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xlsx`,
        );
    };

    const handleExportTopDishesExcel = () => {
        if (!data) return;

        const wb = XLSX.utils.book_new();

        const dishRows = [
            ['#', 'Tên món ăn', 'Số lượng bán', 'Doanh thu (VND)'],
            ...data.topDishes.map((d, i) => [
                i + 1,
                d.dishName,
                d.totalQuantity,
                d.totalRevenue,
            ]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(dishRows);
        ws['!cols'] = [{ wch: 4 }, { wch: 40 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, 'Món bán chạy');

        XLSX.writeFile(
            wb,
            `mon-ban-chay-${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.xlsx`,
        );
    };

    // Format chart data with readable date labels
    const chartData = useMemo(
        () =>
            (data?.dailyRevenue || []).map((d) => ({
                ...d,
                // Use parseISO to safely parse date strings (avoids timezone issues)
                dateLabel: format(parseISO(d.date), 'dd/MM'),
            })),
        [data],
    );

    return (
        <div className="flex flex-col space-y-6 px-4 md:px-6 pb-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Thống kê
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Phân tích tình hình kinh doanh theo từng giai đoạn
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={preset} onValueChange={setPreset}>
                        <SelectTrigger className="w-44">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {PRESET_RANGES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={handleExportExcel}
                        disabled={isLoading || !data}
                        variant="outline"
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                        <Card className="border-l-4 border-l-emerald-500">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tổng doanh thu
                                </CardTitle>
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {formatVndFull(data?.totalRevenue || 0)}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Tổng đơn hàng
                                </CardTitle>
                                <ShoppingBag className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {data?.totalOrders ?? 0}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-purple-500">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Giá trị đơn TB
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">
                                    {formatVndFull(data?.avgOrderValue || 0)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biểu đồ doanh thu theo ngày</CardTitle>
                            <CardDescription>
                                {format(startDate, 'dd/MM/yyyy')} —{' '}
                                {format(endDate, 'dd/MM/yyyy')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {chartData.length === 0 ? (
                                <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                                    Không có dữ liệu trong giai đoạn này
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 5,
                                            right: 5,
                                            left: 10,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="hsl(var(--border))"
                                        />
                                        <XAxis
                                            dataKey="dateLabel"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: 'hsl(var(--muted-foreground))',
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(v) => formatVnd(v)}
                                            tick={{
                                                fontSize: 11,
                                                fill: 'hsl(var(--muted-foreground))',
                                            }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="revenue"
                                            fill="hsl(var(--primary))"
                                            radius={[4, 4, 0, 0]}
                                            name="Doanh thu"
                                        />
                                        <Bar
                                            dataKey="orders"
                                            fill="hsl(var(--primary) / 0.3)"
                                            radius={[4, 4, 0, 0]}
                                            name="Đơn hàng"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Dishes Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-amber-500" />
                                    Món ăn bán chạy
                                </CardTitle>
                                <CardDescription>
                                    Thống kê theo số lượng và doanh thu của tất
                                    cả các món đã bán
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleExportTopDishesExcel}
                                disabled={!data || data.topDishes.length === 0}
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-muted-foreground"
                            >
                                <Download className="h-4 w-4" />
                                Xuất Excel
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!data || data.topDishes.length === 0 ? (
                                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                                    Không có dữ liệu
                                </div>
                            ) : (
                                <div className="overflow-x-auto overflow-y-auto max-h-100px">
                                    <table className="w-full relative">
                                        <thead className="border-b bg-muted/95 sticky top-0 z-10 backdrop-blur-sm">
                                            <tr>
                                                <th className="text-left p-4 text-sm font-semibold">
                                                    #
                                                </th>
                                                <th className="text-left p-4 text-sm font-semibold">
                                                    Tên món
                                                </th>
                                                <th className="text-right p-4 text-sm font-semibold">
                                                    Số lượng bán
                                                </th>
                                                <th className="text-right p-4 text-sm font-semibold">
                                                    Doanh thu
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.topDishes.map(
                                                (dish, index) => (
                                                    <tr
                                                        key={`${dish.dishName}-${index}`}
                                                        className="hover:bg-muted/30 transition-colors"
                                                    >
                                                        <td className="p-4 text-sm font-medium text-muted-foreground">
                                                            {index + 1}
                                                        </td>
                                                        <td className="p-4 font-medium">
                                                            {index === 0 && (
                                                                <span className="mr-1.5">
                                                                    🥇
                                                                </span>
                                                            )}
                                                            {index === 1 && (
                                                                <span className="mr-1.5">
                                                                    🥈
                                                                </span>
                                                            )}
                                                            {index === 2 && (
                                                                <span className="mr-1.5">
                                                                    🥉
                                                                </span>
                                                            )}
                                                            {dish.dishName}
                                                        </td>
                                                        <td className="p-4 text-right text-sm font-semibold">
                                                            {dish.totalQuantity.toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right font-medium text-emerald-600">
                                                            {formatVndFull(
                                                                dish.totalRevenue,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Feedback Tables */}
                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Top Rated */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-emerald-600">
                                    <ThumbsUp className="h-5 w-5" />
                                    Top 5 Món Được Khen Nhiều Nhất
                                </CardTitle>
                                <CardDescription>
                                    Đánh giá trung bình cao nhất
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!data || data.topRatedDishes.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                                        Chưa có đánh giá nào
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b bg-emerald-50/50 dark:bg-emerald-950/20">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold text-emerald-800 dark:text-emerald-400">
                                                        Tên món
                                                    </th>
                                                    <th className="text-right p-3 font-semibold text-emerald-800 dark:text-emerald-400">
                                                        Điểm TB
                                                    </th>
                                                    <th className="text-right p-3 font-semibold text-emerald-800 dark:text-emerald-400">
                                                        Lượt ĐG
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {data.topRatedDishes.map(
                                                    (dish, i) => (
                                                        <tr
                                                            key={`${dish.dishName}-${i}`}
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <td className="p-3 font-medium">
                                                                {i === 0 && (
                                                                    <span className="mr-1.5">
                                                                        🥇
                                                                    </span>
                                                                )}
                                                                {i === 1 && (
                                                                    <span className="mr-1.5">
                                                                        🥈
                                                                    </span>
                                                                )}
                                                                {i === 2 && (
                                                                    <span className="mr-1.5">
                                                                        🥉
                                                                    </span>
                                                                )}
                                                                {dish.dishName}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-emerald-600 flex items-center justify-end gap-1">
                                                                {dish.avgRating.toFixed(
                                                                    1,
                                                                )}
                                                                <Star className="h-3 w-3 fill-emerald-600" />
                                                            </td>
                                                            <td className="p-3 text-right text-muted-foreground">
                                                                {
                                                                    dish.reviewCount
                                                                }
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Criticized */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-rose-600">
                                    <ThumbsDown className="h-5 w-5" />
                                    Top 5 Món Bị Chê Nhiều Nhất
                                </CardTitle>
                                <CardDescription>
                                    Đánh giá trung bình thấp nhất
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!data ||
                                data.topCriticizedDishes.length === 0 ? (
                                    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                                        Chưa có đánh giá nào
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="border-b bg-rose-50/50 dark:bg-rose-950/20">
                                                <tr>
                                                    <th className="text-left p-3 font-semibold text-rose-800 dark:text-rose-400">
                                                        Tên món
                                                    </th>
                                                    <th className="text-right p-3 font-semibold text-rose-800 dark:text-rose-400">
                                                        Điểm TB
                                                    </th>
                                                    <th className="text-right p-3 font-semibold text-rose-800 dark:text-rose-400">
                                                        Lượt ĐG
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {data.topCriticizedDishes.map(
                                                    (dish, i) => (
                                                        <tr
                                                            key={`${dish.dishName}-${i}`}
                                                            className="hover:bg-muted/30"
                                                        >
                                                            <td className="p-3 font-medium">
                                                                {i === 0 && (
                                                                    <span className="mr-1.5 text-rose-600">
                                                                        ⚠️
                                                                    </span>
                                                                )}
                                                                {dish.dishName}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-rose-600 flex items-center justify-end gap-1">
                                                                {dish.avgRating.toFixed(
                                                                    1,
                                                                )}
                                                                <Star className="h-3 w-3 fill-rose-600" />
                                                            </td>
                                                            <td className="p-3 text-right text-muted-foreground">
                                                                {
                                                                    dish.reviewCount
                                                                }
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
