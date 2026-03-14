'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    Package,
    AlertTriangle,
    RefreshCw,
    TrendingDown,
    CheckCircle2,
    BoxesIcon,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/domain/use-auth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Schema
const inventorySchema = z.object({
    restaurantId: z.string().uuid(),
    supplierId: z.string().uuid().optional().or(z.literal('')),
    itemName: z.string().trim().min(1, 'Tên mặt hàng không được trống'),
    quantity: z.coerce.number().min(0, 'Số lượng không hợp lệ'),
    unit: z.string().trim().min(1, 'Đơn vị tính không được trống'),
    threshold: z.coerce
        .number()
        .min(0, 'Ngưỡng tối thiểu không hợp lệ')
        .optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryItem {
    id: string;
    restaurantId: string;
    supplierId: string | null;
    supplier?: {
        name: string;
    };
    itemName: string;
    quantity: number | string;
    unit: string;
    threshold: number | string | null;
    createdAt: string;
    updatedAt: string;
}

type StatusFilter = 'all' | 'low' | 'ok';

function StockStatusBadge({ item }: { item: InventoryItem }) {
    const qty = Number(item.quantity);
    const threshold = Number(item.threshold ?? 0);
    const isLow = item.threshold !== null && qty <= threshold;
    if (isLow) {
        return (
            <Badge variant="destructive" className="gap-1 whitespace-nowrap">
                <AlertTriangle className="h-3 w-3" />
                Sắp hết
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200 whitespace-nowrap"
        >
            <CheckCircle2 className="h-3 w-3" />
            Đủ hàng
        </Badge>
    );
}

function StockProgressBar({ item }: { item: InventoryItem }) {
    const qty = Number(item.quantity);
    const threshold = Number(item.threshold ?? 0);
    if (!threshold || threshold === 0) return null;
    const pct = Math.min((qty / (threshold * 3)) * 100, 100);
    const isLow = qty <= threshold;
    return (
        <div className="w-full min-w-20">
            <Progress
                value={pct}
                className={cn(
                    'h-1.5',
                    isLow ? '[&>div]:bg-rose-500' : '[&>div]:bg-emerald-500',
                )}
            />
        </div>
    );
}

export default function AdminInventoryPage() {
    const { user } = useAuth();
    const { data: restaurants } = trpc.restaurant.list.useQuery(
        {},
        { enabled: !user?.roleId },
    );
    const restaurantId = restaurants?.items?.[0]?.id;

    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<InventoryItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<InventoryFormValues>({
        resolver: zodResolver(inventorySchema) as Resolver<InventoryFormValues>,
        defaultValues: {
            restaurantId: '',
            supplierId: '',
            itemName: '',
            quantity: 0,
            unit: 'kg',
            threshold: 5,
        },
    });

    const getBaseUrl = () =>
        process.env.NEXT_PUBLIC_API_URL?.replace('/trpc', '') ||
        'http://localhost:3052/v1/api';

    const fetchInventory = async () => {
        try {
            setIsRefreshing(true);
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${getBaseUrl()}/inventories?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch inventory');
            const data = await res.json();
            const items = data.data || data;
            setInventoryItems(Array.isArray(items) ? items : []);
        } catch (error) {
            console.error(error);
            toast.error('Không thể tải dữ liệu kho hàng');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${getBaseUrl()}/suppliers?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setSuppliers(Array.isArray(data) ? data : data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers', error);
        }
    };

    useEffect(() => {
        fetchInventory();
        fetchSuppliers();
    }, []);
    useEffect(() => {
        if (restaurantId && !editing)
            form.setValue('restaurantId', restaurantId);
    }, [restaurantId, editing, form]);

    const openCreate = () => {
        if (!restaurantId) {
            toast.error('Không tìm thấy thông tin nhà hàng');
            return;
        }
        setEditing(null);
        form.reset({
            restaurantId,
            supplierId: '',
            itemName: '',
            quantity: 0,
            unit: 'kg',
            threshold: 5,
        });
        setOpen(true);
    };

    const openEdit = (item: InventoryItem) => {
        setEditing(item);
        form.reset({
            restaurantId: item.restaurantId,
            supplierId: item.supplierId || '',
            itemName: item.itemName,
            quantity: Number(item.quantity),
            unit: item.unit,
            threshold: Number(item.threshold || 0),
        });
        setOpen(true);
    };

    const onSubmit: SubmitHandler<InventoryFormValues> = async (values) => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const url = editing
                ? `${getBaseUrl()}/inventories/${editing.id}`
                : `${getBaseUrl()}/inventories`;
            const payload = {
                ...values,
                supplierId:
                    values.supplierId === 'none' || !values.supplierId
                        ? undefined
                        : values.supplierId,
            };
            const res = await fetch(url, {
                method: editing ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to save');
            }
            toast.success(
                editing ? 'Đã cập nhật kho hàng' : 'Đã thêm mặt hàng mới',
            );
            setOpen(false);
            fetchInventory();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${getBaseUrl()}/inventories/${deleteId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete');
            toast.success('Đã xóa mặt hàng');
            setDeleteId(null);
            fetchInventory();
        } catch {
            toast.error('Có lỗi xảy ra khi xóa');
        }
    };

    const stats = useMemo(() => {
        const total = inventoryItems.length;
        const lowStock = inventoryItems.filter((i) => {
            const qty = Number(i.quantity);
            const threshold = Number(i.threshold ?? 0);
            return i.threshold !== null && qty <= threshold;
        }).length;
        const okStock = total - lowStock;
        return { total, lowStock, okStock };
    }, [inventoryItems]);

    const filteredItems = useMemo(() => {
        return inventoryItems.filter((item) => {
            const matchSearch = item.itemName
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const qty = Number(item.quantity);
            const threshold = Number(item.threshold ?? 0);
            const isLow = item.threshold !== null && qty <= threshold;
            const matchStatus =
                statusFilter === 'all' ||
                (statusFilter === 'low' ? isLow : !isLow);
            return matchSearch && matchStatus;
        });
    }, [inventoryItems, searchQuery, statusFilter]);

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý kho hàng
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Theo dõi số lượng hàng tồn kho và cảnh báo nhập hàng.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={fetchInventory}
                        disabled={isRefreshing}
                        className="gap-2"
                    >
                        <RefreshCw
                            className={cn(
                                'w-4 h-4',
                                isRefreshing && 'animate-spin',
                            )}
                        />
                        Làm mới
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="hero"
                                onClick={openCreate}
                                className="gap-2 shadow-lg hover:shadow-primary/25"
                                disabled={!restaurantId}
                            >
                                <Plus className="w-4 h-4" />
                                Thêm mặt hàng
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editing
                                        ? 'Chỉnh sửa mặt hàng'
                                        : 'Thêm mặt hàng mới'}
                                </DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit((data) =>
                                        onSubmit(data),
                                    )}
                                    className="space-y-4 pt-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="itemName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Tên mặt hàng
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Gạo, Thịt, Rau..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="supplierId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Nhà cung cấp
                                                </FormLabel>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn nhà cung cấp (không bắt buộc)" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="none">
                                                            Không chọn
                                                        </SelectItem>
                                                        {suppliers.map((s) => (
                                                            <SelectItem
                                                                key={s.id}
                                                                value={s.id}
                                                            >
                                                                {s.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>
                                                    Gắn mặt hàng này với một nhà
                                                    cung cấp.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Số lượng tồn
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="unit"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Đơn vị tính
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn đơn vị" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="kg">
                                                                kg
                                                            </SelectItem>
                                                            <SelectItem value="g">
                                                                g
                                                            </SelectItem>
                                                            <SelectItem value="l">
                                                                lít
                                                            </SelectItem>
                                                            <SelectItem value="ml">
                                                                ml
                                                            </SelectItem>
                                                            <SelectItem value="hộp">
                                                                cái/hộp
                                                            </SelectItem>
                                                            <SelectItem value="gói">
                                                                gói
                                                            </SelectItem>
                                                            <SelectItem value="chai">
                                                                chai
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="threshold"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Ngưỡng cảnh báo (Tối thiểu)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min={0}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Hệ thống sẽ cảnh báo khi số
                                                    lượng đạt hoặc dưới mức này.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOpen(false)}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="hero"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                            {editing
                                                ? 'Lưu thay đổi'
                                                : 'Tạo mới'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription className="text-primary/80 font-medium text-xs uppercase tracking-wide">
                            Tổng mặt hàng
                        </CardDescription>
                        <BoxesIcon className="h-4 w-4 text-primary/60" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-display text-primary">
                            {stats.total}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Đang quản lý
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-200">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription className="text-emerald-700 font-medium text-xs uppercase tracking-wide">
                            Đủ hàng
                        </CardDescription>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold font-display text-emerald-600">
                            {stats.okStock}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Mặt hàng còn đủ
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        'bg-linear-to-br border',
                        stats.lowStock > 0
                            ? 'from-rose-500/5 to-rose-500/10 border-rose-200'
                            : 'from-muted/5 to-muted/10',
                    )}
                >
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardDescription
                            className={cn(
                                'font-medium text-xs uppercase tracking-wide',
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
                        <p className="text-xs text-muted-foreground mt-1">
                            Cần nhập thêm
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Low stock alert banner */}
            {stats.lowStock > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">
                        Có <strong>{stats.lowStock}</strong> mặt hàng đang ở mức
                        thấp cần nhập thêm hàng.
                    </p>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm mặt hàng..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['all', 'ok', 'low'] as StatusFilter[]).map((s) => (
                        <Button
                            key={s}
                            size="sm"
                            variant={statusFilter === s ? 'default' : 'outline'}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                                'gap-1.5',
                                statusFilter === s &&
                                    s === 'low' &&
                                    'bg-rose-500 hover:bg-rose-600 border-rose-500',
                                statusFilter === s &&
                                    s === 'ok' &&
                                    'bg-emerald-500 hover:bg-emerald-600 border-emerald-500',
                            )}
                        >
                            {s === 'all' && 'Tất cả'}
                            {s === 'ok' && (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Đủ
                                    hàng
                                </>
                            )}
                            {s === 'low' && (
                                <>
                                    <AlertTriangle className="h-3.5 w-3.5" />{' '}
                                    Sắp hết
                                </>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex justify-center p-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-muted-foreground gap-3">
                            <Package className="h-12 w-12 opacity-20" />
                            <p className="text-sm">
                                {searchQuery || statusFilter !== 'all'
                                    ? 'Không tìm thấy mặt hàng nào'
                                    : 'Chưa có dữ liệu kho hàng'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="p-4 font-semibold">
                                            Tên mặt hàng
                                        </th>
                                        <th className="p-4 font-semibold hidden md:table-cell">
                                            Nhà cung cấp
                                        </th>
                                        <th className="p-4 font-semibold">
                                            Số lượng
                                        </th>
                                        <th className="p-4 font-semibold">
                                            Đơn vị
                                        </th>
                                        <th className="p-4 font-semibold hidden md:table-cell">
                                            Tồn / Ngưỡng
                                        </th>
                                        <th className="p-4 font-semibold">
                                            Trạng thái
                                        </th>
                                        <th className="p-4 font-semibold hidden lg:table-cell text-muted-foreground">
                                            Cập nhật
                                        </th>
                                        <th className="p-4 font-semibold text-right">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredItems.map((item) => {
                                        const qty = Number(item.quantity);
                                        const threshold = Number(
                                            item.threshold ?? 0,
                                        );
                                        const isLow =
                                            item.threshold !== null &&
                                            qty <= threshold;
                                        return (
                                            <tr
                                                key={item.id}
                                                className={cn(
                                                    'hover:bg-muted/30 transition-colors',
                                                    isLow &&
                                                        'bg-rose-50/50 dark:bg-rose-950/20',
                                                )}
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={cn(
                                                                'h-2 w-2 rounded-full shrink-0',
                                                                isLow
                                                                    ? 'bg-rose-500'
                                                                    : 'bg-emerald-500',
                                                            )}
                                                        />
                                                        <span className="font-medium">
                                                            {item.itemName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className="text-muted-foreground italic">
                                                        {item.supplier?.name ||
                                                            '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={cn(
                                                            'font-bold text-base',
                                                            Number(
                                                                item.quantity,
                                                            ) <=
                                                                Number(
                                                                    item.threshold ??
                                                                        0,
                                                                ) &&
                                                                item.threshold !==
                                                                    null
                                                                ? 'text-rose-600'
                                                                : 'text-foreground',
                                                        )}
                                                    >
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-muted-foreground">
                                                    {item.unit}
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <div className="space-y-1 min-w-30">
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>
                                                                {item.quantity}{' '}
                                                                /{' '}
                                                                {item.threshold ??
                                                                    '∞'}
                                                            </span>
                                                        </div>
                                                        <StockProgressBar
                                                            item={item}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <StockStatusBadge
                                                        item={item}
                                                    />
                                                </td>
                                                <td className="p-4 hidden lg:table-cell text-xs text-muted-foreground">
                                                    {item.updatedAt
                                                        ? format(
                                                              new Date(
                                                                  item.updatedAt,
                                                              ),
                                                              'dd/MM/yyyy HH:mm',
                                                              { locale: vi },
                                                          )
                                                        : '-'}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                            onClick={() =>
                                                                openEdit(item)
                                                            }
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa mặt hàng này khỏi kho?
                            Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
