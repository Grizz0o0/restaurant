'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PromotionSchema, type CreatePromotionType } from '@repo/schema';
import { Plus, Pencil, Trash2, Loader2, Search, Ticket } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Badge } from '@/shared/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/shared/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';

const promotionSchema = z.object({
    code: z
        .string()
        .trim()
        .min(1, 'Mã khuyến mãi không được trống')
        .max(50)
        .toUpperCase(),
    type: z.enum(['FIXED', 'PERCENTAGE']),
    amount: z.coerce.number().min(0).optional(),
    percentage: z.coerce.number().min(0).max(100).optional(),
    minOrderValue: z.coerce.number().min(0).optional(),
    validFrom: z.string(), // ISO string from datetime-local input
    validTo: z.string(), // ISO string from datetime-local input
    usageLimit: z.coerce.number().int().min(1).optional(),
});

type PromotionFormValues = z.infer<typeof promotionSchema>;
type PromotionType = z.infer<typeof PromotionSchema>;

export default function AdminPromotionsPage() {
    const utils = trpc.useUtils();

    // Data Fetching
    const { data: promotionsData, isLoading } = trpc.promotion.list.useQuery();

    const promotions = promotionsData || [];

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PromotionType | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [promoType, setPromoType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED');

    const form = useForm<PromotionFormValues>({
        resolver: zodResolver(promotionSchema) as Resolver<PromotionFormValues>,
        defaultValues: {
            code: '',
            type: 'FIXED',
            amount: 0,
            percentage: 0,
            minOrderValue: 0,
            validFrom: new Date().toISOString().slice(0, 16),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 16),
            usageLimit: undefined,
        },
    });

    // Update promoType state when form type changes
    const watchType = form.watch('type');
    if (watchType !== promoType) {
        setPromoType(watchType);
    }

    // Mutations
    const createMutation = trpc.promotion.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo khuyến mãi mới');
            utils.promotion.list.invalidate();
            setOpen(false);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const updateMutation = trpc.promotion.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật khuyến mãi');
            utils.promotion.list.invalidate();
            setOpen(false);
            setEditing(null);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const deleteMutation = trpc.promotion.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa khuyến mãi');
            utils.promotion.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    // Handlers
    const openCreate = () => {
        setEditing(null);
        setPromoType('FIXED');
        form.reset({
            code: '',
            type: 'FIXED',
            amount: 0,
            percentage: undefined,
            minOrderValue: 0,
            validFrom: new Date().toISOString().slice(0, 16),
            validTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 16),
            usageLimit: undefined,
        });
        setOpen(true);
    };

    const openEdit = (promo: PromotionType) => {
        setEditing(promo);
        setPromoType(promo.type || 'FIXED');
        form.reset({
            code: promo.code,
            type: promo.type,
            amount: Number(promo.amount || 0),
            percentage: Number(promo.percentage || 0),
            minOrderValue: Number(promo.minOrderValue || 0),
            validFrom: new Date(promo.validFrom).toISOString().slice(0, 16),
            validTo: new Date(promo.validTo).toISOString().slice(0, 16),
            usageLimit: promo.usageLimit || undefined,
        });
        setOpen(true);
    };

    const onSubmit = (values: PromotionFormValues) => {
        const payload = {
            ...values,
            amount: values.type === 'FIXED' ? values.amount || 0 : 0,
            percentage:
                values.type === 'PERCENTAGE' ? values.percentage || 0 : 0,
            validFrom: new Date(values.validFrom).toISOString(),
            validTo: new Date(values.validTo).toISOString(),
        };

        if (editing) {
            updateMutation.mutate({
                id: editing.id,
                data: payload,
            });
        } else {
            createMutation.mutate(payload as CreatePromotionType);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            deleteMutation.mutate({ id: deleteId });
        }
    };

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    const isActive = (promo: PromotionType) => {
        const now = new Date();
        const start = new Date(promo.validFrom);
        const end = new Date(promo.validTo);
        const limitReached =
            promo.usageLimit && (promo.usedCount ?? 0) >= promo.usageLimit;
        return now >= start && now <= end && !limitReached;
    };

    // Filtering Logic
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPromotions = useMemo(() => {
        return promotions.filter((promo) => {
            return (promo.code ?? '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        });
    }, [promotions, searchQuery]);

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý khuyến mãi
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Tạo và quản lý các mã giảm giá cho khách hàng.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.promotion.list.invalidate()}
                    >
                        Làm mới
                    </Button>
                    <Dialog
                        open={open}
                        onOpenChange={(v) => {
                            setOpen(v);
                            if (!v) setEditing(null);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="hero"
                                onClick={openCreate}
                                className="gap-2 shadow-lg hover:shadow-primary/25"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm khuyến mãi
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">
                                    {editing
                                        ? 'Chỉnh sửa khuyến mãi'
                                        : 'Thêm khuyến mãi mới'}
                                </DialogTitle>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4 pt-4"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="code"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Mã khuyến mãi (Code)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="SALE50, SUMMER2024..."
                                                            {...field}
                                                            onChange={(e) =>
                                                                field.onChange(
                                                                    e.target.value.toUpperCase(),
                                                                )
                                                            }
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Loại giảm giá
                                                    </FormLabel>
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="FIXED">
                                                                Số tiền cố định
                                                            </SelectItem>
                                                            <SelectItem value="PERCENTAGE">
                                                                Phần trăm (%)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {promoType === 'FIXED' ? (
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Số tiền giảm (VNĐ)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                step={1000}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        ) : (
                                            <FormField
                                                control={form.control}
                                                name="percentage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Phần trăm giảm (%)
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                max={100}
                                                                step={1}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        <FormField
                                            control={form.control}
                                            name="minOrderValue"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Đơn hàng tối thiểu
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            step={1000}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="validFrom"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Bắt đầu từ
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="datetime-local"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="validTo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Kết thúc lúc
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="datetime-local"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="usageLimit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Giới hạn số lần dùng (để
                                                    trống nếu không giới hạn)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min={1}
                                                        {...field}
                                                        value={
                                                            field.value || ''
                                                        }
                                                    />
                                                </FormControl>
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
                                            disabled={
                                                createMutation.isPending ||
                                                updateMutation.isPending
                                            }
                                        >
                                            {createMutation.isPending ||
                                            updateMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Đang lưu...
                                                </>
                                            ) : editing ? (
                                                'Cập nhật'
                                            ) : (
                                                'Tạo mới'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Tìm theo mã code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Promotions List */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredPromotions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <Ticket className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold text-lg">
                                Không tìm thấy khuyến mãi
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                    ? 'Thử thay đổi từ khóa tìm kiếm'
                                    : 'Hãy tạo khuyến mãi đầu tiên'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Mã Code
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Giảm giá
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Đơn tối thiểu
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Thời gian
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Lượt dùng
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Trạng thái
                                        </th>
                                        <th className="text-right p-4 font-semibold text-sm">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredPromotions.map((promo) => (
                                        <tr
                                            key={promo.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="font-mono font-bold text-base">
                                                    {promo.code}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {promo.type === 'PERCENTAGE' ? (
                                                    <Badge variant="outline">
                                                        Giảm {promo.percentage}%
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">
                                                        Giảm{' '}
                                                        {formatVnd(
                                                            Number(
                                                                promo.amount,
                                                            ),
                                                        )}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {promo.minOrderValue > 0
                                                    ? formatVnd(
                                                          Number(
                                                              promo.minOrderValue,
                                                          ),
                                                      )
                                                    : 'Không'}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">
                                                            Từ:
                                                        </span>
                                                        {format(
                                                            new Date(
                                                                promo.validFrom,
                                                            ),
                                                            'dd/MM/yyyy HH:mm',
                                                            { locale: vi },
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs">
                                                            Đến:
                                                        </span>
                                                        {format(
                                                            new Date(
                                                                promo.validTo,
                                                            ),
                                                            'dd/MM/yyyy HH:mm',
                                                            { locale: vi },
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {(promo.usedCount ?? 0) +
                                                    '/' +
                                                    (promo.usageLimit ?? '∞')}
                                            </td>
                                            <td className="p-4">
                                                {isActive(promo) ? (
                                                    <Badge className="bg-green-600">
                                                        Đang chạy
                                                    </Badge>
                                                ) : new Date() >
                                                  new Date(promo.validTo) ? (
                                                    <Badge variant="secondary">
                                                        Đã kết thúc
                                                    </Badge>
                                                ) : new Date() <
                                                  new Date(promo.validFrom) ? (
                                                    <Badge variant="outline">
                                                        Sắp chạy
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        Hết lượt
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(promo)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            handleDelete(
                                                                promo.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận xóa khuyến mãi
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa mã khuyến mãi này? Hành động
                            này không thể hoàn tác.
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
