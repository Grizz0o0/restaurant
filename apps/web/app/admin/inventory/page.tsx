'use client';

import { useMemo, useState } from 'react';
import {
    BoxesIcon,
    CheckCircle2,
    TrendingDown,
    AlertTriangle,
    Package,
    ChefHat,
    History,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/domain/use-auth';
import { cn } from '@/lib/utils';

// New components
import { InventoryList } from './components/InventoryList';
import { RecipeManager } from './components/RecipeManager';
import { InventoryHistory } from './components/InventoryHistory';

export default function AdminInventoryPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('stock');

    const { data: restaurants } = trpc.restaurant.list.useQuery(
        {},
        { enabled: !user?.roleId },
    );
    const restaurantId = restaurants?.items?.[0]?.id || '';

    const { data: inventoryData } = trpc.inventory.list.useQuery({
        page: 1,
        limit: 100,
    });
    const inventoryItems = inventoryData?.data || [];

    const stats = useMemo(() => {
        const total = inventoryItems.length;
        const lowStock = inventoryItems.filter((i: any) => {
            const qty = Number(i.quantity);
            const threshold = Number(i.threshold ?? 0);
            return i.threshold !== null && qty <= threshold;
        }).length;
        const okStock = total - lowStock;
        return { total, lowStock, okStock };
    }, [inventoryItems]);

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý kho & Định lượng
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Theo dõi tồn kho, thiết lập công thức món ăn và xem lịch
                        sử biến động.
                    </p>
                </div>
            </div>

            {/* Stats Cards - Only show on Stock/History tabs for better UX or keep as overview */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription className="text-primary/80 font-semibold text-[10px] uppercase tracking-wider">
                            Tổng mặt hàng
                        </CardDescription>
                        <BoxesIcon className="h-4 w-4 text-primary/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-display text-primary">
                            {stats.total}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Đang quản lý trong kho
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-200 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription className="text-emerald-700 font-semibold text-[10px] uppercase tracking-wider">
                            Đủ hàng
                        </CardDescription>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-display text-emerald-600">
                            {stats.okStock}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Mặt hàng ở mức an toàn
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        'bg-linear-to-br border shadow-sm transition-all hover:shadow-md',
                        stats.lowStock > 0
                            ? 'from-rose-500/5 to-rose-500/10 border-rose-200'
                            : 'from-muted/5 to-muted/10',
                    )}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription
                            className={cn(
                                'font-semibold text-[10px] uppercase tracking-wider',
                                stats.lowStock > 0
                                    ? 'text-rose-700'
                                    : 'text-muted-foreground',
                            )}
                        >
                            Cảnh báo sắp hết
                        </CardDescription>
                        <TrendingDown
                            className={cn(
                                'h-4 w-4',
                                stats.lowStock > 0
                                    ? 'text-rose-500'
                                    : 'text-muted-foreground',
                            )}
                        />
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                'text-3xl font-bold font-display',
                                stats.lowStock > 0
                                    ? 'text-rose-600'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {stats.lowStock}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Cần nhập thêm ngay
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Low stock alert banner */}
            {stats.lowStock > 0 && activeTab === 'stock' && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium italic">
                        Có {stats.lowStock} mặt hàng đang dưới ngưỡng tối thiểu.
                        Vui lòng kiểm tra và nhập thêm hàng.
                    </p>
                </div>
            )}

            {/* Main Content with Tabs */}
            <Tabs
                defaultValue="stock"
                className="w-full"
                onValueChange={setActiveTab}
            >
                <TabsList className="bg-muted/50 p-1.5 h-12 rounded-xl border mb-6">
                    <TabsTrigger
                        value="stock"
                        className="rounded-lg gap-2 px-4 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <Package className="h-4 w-4" />
                        Kho hàng
                    </TabsTrigger>
                    <TabsTrigger
                        value="recipe"
                        className="rounded-lg gap-2 px-4 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <ChefHat className="h-4 w-4" />
                        Định lượng món
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="rounded-lg gap-2 px-4 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                        <History className="h-4 w-4" />
                        Lịch sử kho
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="stock"
                    className="mt-0 focus-visible:outline-none"
                >
                    <InventoryList restaurantId={restaurantId} />
                </TabsContent>

                <TabsContent
                    value="recipe"
                    className="mt-0 focus-visible:outline-none"
                >
                    <RecipeManager />
                </TabsContent>

                <TabsContent
                    value="history"
                    className="mt-0 focus-visible:outline-none"
                >
                    <InventoryHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
