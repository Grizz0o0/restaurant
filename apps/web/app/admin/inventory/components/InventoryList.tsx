'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
    CheckCircle2,
    PackagePlus,
    ArrowRightLeft,
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
import { Card, CardContent } from '@/components/ui/card';
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

export function InventoryList({ restaurantId }: { restaurantId: string }) {
    const utils = trpc.useUtils();

    // TRPC Queries
    const {
        data: inventoryData,
        isLoading,
        refetch: refetchInventory,
        isFetching: isRefreshing,
    } = trpc.inventory.list.useQuery({ page: 1, limit: 100 });
    const inventoryItems: InventoryItem[] = (inventoryData?.data ??
        []) as InventoryItem[];

    const { data: suppliersData } = trpc.supplier.list.useQuery({
        page: 1,
        limit: 100,
    });
    const suppliers: any[] = suppliersData?.data ?? [];

    // TRPC Mutations
    const createMutation = trpc.inventory.create.useMutation({
        onSuccess: () => {
            toast.success('Đã thêm mặt hàng mới');
            utils.inventory.list.invalidate();
            setOpen(false);
        },
        onError: (err) => toast.error(err.message || 'Có lỗi xảy ra'),
    });

    const updateMutation = trpc.inventory.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật kho hàng');
            utils.inventory.list.invalidate();
            setOpen(false);
            setEditing(null);
        },
        onError: (err) => toast.error(err.message || 'Có lỗi xảy ra'),
    });

    const deleteMutation = trpc.inventory.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa mặt hàng');
            utils.inventory.list.invalidate();
            setDeleteId(null);
        },
        onError: () => toast.error('Có lỗi xảy ra khi xóa'),
    });

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<InventoryItem | null>(null);
    const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
    const [adjustValue, setAdjustValue] = useState<string>('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

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

    const onSubmit = async (values: InventoryFormValues) => {
        const payload = {
            ...values,
            supplierId:
                values.supplierId === 'none' || !values.supplierId
                    ? undefined
                    : values.supplierId,
        };
        if (editing) {
            const { restaurantId: _rid, ...updateData } = payload;
            updateMutation.mutate({ id: editing.id, data: updateData });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleAdjustSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjusting || !adjustValue) return;
        const diff = Number(adjustValue);
        if (isNaN(diff) || diff === 0) return;

        // Round to 4 decimal places to avoid floating point issues
        const newQty =
            Math.round((Number(adjusting.quantity) + diff) * 10000) / 10000;
        if (newQty < 0) {
            toast.error('Số lượng tồn mới không được nhỏ hơn 0');
            return;
        }

        updateMutation.mutate({
            id: adjusting.id,
            data: {
                quantity: newQty,
            },
        });
        setAdjusting(null);
        setAdjustValue('');
    };

    const confirmDelete = () => {
        if (deleteId) deleteMutation.mutate({ id: deleteId });
    };

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
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative flex-1 max-w-md min-w-50">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm mặt hàng..."
                            className="pl-10 h-11 text-base border-muted-foreground/20 shadow-xs focus-visible:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                        {(['all', 'ok', 'low'] as StatusFilter[]).map((s) => (
                            <Button
                                key={s}
                                size="sm"
                                variant={
                                    statusFilter === s ? 'default' : 'outline'
                                }
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    'gap-1.5 whitespace-nowrap',
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
                                        <CheckCircle2 className="h-3.5 w-3.5" />{' '}
                                        Đủ hàng
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
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchInventory()}
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
                                size="sm"
                                onClick={openCreate}
                                className="gap-2 shadow-sm"
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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                                            disabled={!!editing}
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
                                            disabled={
                                                createMutation.isPending ||
                                                updateMutation.isPending
                                            }
                                        >
                                            {(createMutation.isPending ||
                                                updateMutation.isPending) && (
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

            <Card className="overflow-hidden border-muted/20 shadow-sm">
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
                                            Sức chứa
                                        </th>
                                        <th className="p-4 font-semibold">
                                            Trạng thái
                                        </th>
                                        <th className="p-4 font-semibold text-right">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-muted/10">
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
                                                    <span className="font-medium">
                                                        {item.itemName}
                                                    </span>
                                                </td>
                                                <td className="p-4 hidden md:table-cell">
                                                    <span className="text-muted-foreground italic text-xs">
                                                        {item.supplier?.name ||
                                                            '-'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span
                                                        className={cn(
                                                            'font-bold text-base',
                                                            isLow
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
                                                <td className="p-4 hidden md:table-cell min-w-30">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                                            <span>
                                                                {item.quantity}/
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
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() =>
                                                                setAdjusting(
                                                                    item,
                                                                )
                                                            }
                                                            title="Điều chỉnh số lượng"
                                                        >
                                                            <PackagePlus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-primary"
                                                            onClick={() =>
                                                                openEdit(item)
                                                            }
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() =>
                                                                setDeleteId(
                                                                    item.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
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
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Mặt hàng này sẽ bị
                            xóa khỏi kho.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-rose-600 hover:bg-rose-700"
                        >
                            Xóa ngay
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Adjust Stock Dialog */}
            <Dialog
                open={!!adjusting}
                onOpenChange={(open) => !open && setAdjusting(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Điều chỉnh Tồn kho</DialogTitle>
                    </DialogHeader>
                    {adjusting && (
                        <form
                            onSubmit={handleAdjustSubmit}
                            className="space-y-4 pt-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Tên mặt hàng
                                </label>
                                <div className="font-semibold">
                                    {adjusting.itemName}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">
                                        Tồn kho hiện tại
                                    </label>
                                    <Input
                                        disabled
                                        value={`${adjusting.quantity} ${adjusting.unit}`}
                                        className="bg-muted font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">
                                        Biến động (+/-)
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={adjustValue}
                                            onChange={(e) =>
                                                setAdjustValue(e.target.value)
                                            }
                                            placeholder="VD: +50 hoặc -10"
                                            required
                                            autoFocus
                                            className={cn(
                                                'font-bold pr-10',
                                                Number(adjustValue) > 0
                                                    ? 'text-emerald-600 focus-visible:ring-emerald-500'
                                                    : Number(adjustValue) < 0
                                                      ? 'text-rose-600 focus-visible:ring-rose-500'
                                                      : '',
                                            )}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                            {adjusting.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {adjustValue && (
                                <div className="p-3 bg-muted/50 rounded-lg border flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                        Tồn kho dự kiến:
                                    </span>
                                    <span
                                        className={cn(
                                            'font-bold text-lg flex items-center gap-1',
                                            Math.round(
                                                (Number(adjusting.quantity) +
                                                    Number(adjustValue)) *
                                                    10000,
                                            ) /
                                                10000 <
                                                Number(adjusting.threshold) &&
                                                'text-rose-600',
                                        )}
                                    >
                                        {Number(adjustValue) > 0 && (
                                            <ArrowRightLeft className="w-3 h-3 text-emerald-500" />
                                        )}
                                        {Math.round(
                                            (Number(adjusting.quantity) +
                                                Number(adjustValue)) *
                                                10000,
                                        ) / 10000}{' '}
                                        {adjusting.unit}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAdjusting(null)}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    variant="hero"
                                    disabled={
                                        updateMutation.isPending || !adjustValue
                                    }
                                >
                                    {updateMutation.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    )}
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
