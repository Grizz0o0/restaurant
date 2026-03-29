'use client';

import { useMemo, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RestaurantTableType } from '@repo/schema';
import { Plus, Pencil, Trash2, Loader2, Search, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
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

const tableSchema = z.object({
    tableNumber: z.string().trim().min(1, 'Số bàn không được trống').max(50),
    capacity: z.coerce.number().int().min(1, 'Sức chứa phải lớn hơn 0'),
    status: z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED']).optional(),
});

type TableFormValues = z.infer<typeof tableSchema>;

export default function AdminTablesPage() {
    const utils = trpc.useUtils();

    // Data Fetching
    const { data: tablesData, isLoading } = trpc.table.list.useQuery({
        page: 1,
        limit: 100,
    });

    const tables = tablesData?.data || [];

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RestaurantTableType | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [qrCodeView, setQrCodeView] = useState<{ tableNumber?: string | null; qrCodeUrl?: string | null; qrCode?: string | null} | null>(null);

    const form = useForm<TableFormValues>({
        resolver: zodResolver(tableSchema) as Resolver<TableFormValues>,
        defaultValues: {
            tableNumber: '',
            capacity: 2,
            status: 'AVAILABLE',
        },
    });

    // Mutations
    const createMutation = trpc.table.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo bàn mới');
            utils.table.list.invalidate();
            setOpen(false);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const updateMutation = trpc.table.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật thông tin bàn');
            utils.table.list.invalidate();
            setOpen(false);
            setEditing(null);
            form.reset();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const deleteMutation = trpc.table.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa bàn');
            utils.table.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    // Handlers
    const openCreate = () => {
        setEditing(null);
        form.reset({
            tableNumber: '',
            capacity: 4,
            status: 'AVAILABLE',
        });
        setOpen(true);
    };

    const openEdit = (table: RestaurantTableType) => {
        setEditing(table);
        form.reset({
            tableNumber: table.tableNumber || '',
            capacity: table.capacity || 2,
            status: (table.status as TableFormValues['status']) || 'AVAILABLE',
        });
        setOpen(true);
    };

    const onSubmit = (values: TableFormValues) => {
        if (editing) {
            updateMutation.mutate({
                id: editing.id,
                data: {
                    tableNumber: values.tableNumber,
                    capacity: values.capacity,
                    status: values.status,
                },
            });
        } else {
            createMutation.mutate({
                tableNumber: values.tableNumber,
                capacity: values.capacity,
                status: values.status || 'AVAILABLE',
            });
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

    // Filtering Logic
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTables = useMemo(() => {
        return tables.filter((table) => {
            return (table.tableNumber ?? '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
        });
    }, [tables, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const total = tables.length;
        const available = tables.filter((t) => t.status === 'AVAILABLE').length;
        const occupied = tables.filter((t) => t.status === 'OCCUPIED').length;
        const reserved = tables.filter((t) => t.status === 'RESERVED').length;
        return { total, available, occupied, reserved };
    }, [tables]);

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý bàn ăn
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quản lý danh sách bàn, mã QR và trạng thái.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.table.list.invalidate()}
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
                                Thêm bàn
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">
                                    {editing ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
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
                                            name="tableNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Số bàn / Tên bàn
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Bàn 1, VIP 1..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="capacity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Sức chứa (người)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
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
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Trạng thái
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
                                                        <SelectItem value="AVAILABLE">
                                                            Trống
                                                        </SelectItem>
                                                        <SelectItem value="OCCUPIED">
                                                            Đang có khách
                                                        </SelectItem>
                                                        <SelectItem value="RESERVED">
                                                            Đã đặt trước
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
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
                            Tổng số bàn
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Bàn trống
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.available}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Sẵn sàng đón khách
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Đang dùng
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.occupied}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Đang phục vụ
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Đặt trước
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.reserved}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Đã được đặt
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Tìm theo số bàn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Tables Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredTables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center border rounded-lg bg-muted/10">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <QrCode className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg">
                        Không tìm thấy bàn nào
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {searchQuery
                            ? 'Thử thay đổi từ khóa tìm kiếm'
                            : 'Hãy thêm bàn đầu tiên để bắt đầu'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredTables.map((table) => (
                        <Card key={table.id} className="overflow-hidden">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl">
                                            {table.tableNumber}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {table.capacity} ghế
                                        </CardDescription>
                                    </div>
                                    <Badge
                                        variant={
                                            table.status === 'AVAILABLE'
                                                ? 'default'
                                                : table.status === 'OCCUPIED'
                                                  ? 'destructive'
                                                  : 'secondary'
                                        }
                                    >
                                        {table.status === 'AVAILABLE'
                                            ? 'Trống'
                                            : table.status === 'OCCUPIED'
                                              ? 'Có khách'
                                              : 'Đặt trước'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => setQrCodeView(table)}
                                    >
                                        <QrCode className="w-3 h-3 mr-2" />
                                        Mã QR
                                    </Button>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => openEdit(table)}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() =>
                                                handleDelete(table.id)
                                            }
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* QR Code Dialog */}
            <Dialog
                open={!!qrCodeView}
                onOpenChange={(v) => !v && setQrCodeView(null)}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            Mã QR - {qrCodeView?.tableNumber}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4">
                        <div className="w-48 h-48 bg-white border rounded-lg flex items-center justify-center overflow-hidden">
                            {qrCodeView?.qrCodeUrl ? (
                                <QRCodeSVG
                                    value={qrCodeView.qrCodeUrl}
                                    size={160}
                                    level="H"
                                    includeMargin={true}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground text-sm p-4">
                                    {qrCodeView?.qrCode || 'Chưa có mã QR'}
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Quét mã để gọi món tại bàn {qrCodeView?.tableNumber}
                        </p>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => window.print()}
                        >
                            In mã QR
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa bàn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa bàn này? Các đơn hàng liên quan
                            có thể bị ảnh hưởng.
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
