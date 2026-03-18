'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Pencil,
    Trash2,
    Loader2,
    Search,
    Truck,
    Star,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { ImageUpload } from '@/components/ui/image-upload';

const supplierSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Tên nhà cung cấp không được trống')
        .max(200),
    logo: z.string().trim().optional().or(z.literal('')),
    contactName: z.string().trim().max(200).optional().or(z.literal('')),
    phoneNumber: z.string().trim().max(50).optional().or(z.literal('')),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    website: z.string().url('URL không hợp lệ').optional().or(z.literal('')),
    rating: z
        .preprocess((val) => {
            if (val === '' || val === undefined || val === null)
                return undefined;
            const num = Number(val);
            return isNaN(num) ? undefined : num;
        }, z.number().min(0).max(5).optional())
        .optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function AdminSuppliersPage() {
    const utils = trpc.useUtils();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const form = useForm<SupplierFormValues>({
        resolver: zodResolver(supplierSchema) as Resolver<SupplierFormValues>,
        defaultValues: {
            name: '',
            logo: '',
            contactName: '',
            phoneNumber: '',
            email: '',
            website: '',
            rating: 0,
        },
    });

    // Fetch suppliers via TRPC
    const { data: suppliersData, isLoading } = trpc.supplier.list.useQuery({
        page: 1,
        limit: 100,
    });

    const suppliers: any[] = suppliersData?.data ?? [];

    // Mutations
    const createMutation = trpc.supplier.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo nhà cung cấp mới');
            utils.supplier.list.invalidate();
            setOpen(false);
            form.reset();
        },
        onError: (err) => toast.error(err.message || 'Có lỗi xảy ra'),
    });

    const updateMutation = trpc.supplier.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật nhà cung cấp');
            utils.supplier.list.invalidate();
            setOpen(false);
            setEditing(null);
            form.reset();
        },
        onError: (err) => toast.error(err.message || 'Có lỗi xảy ra'),
    });

    const deleteMutation = trpc.supplier.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa nhà cung cấp');
            utils.supplier.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => toast.error(err.message || 'Có lỗi xảy ra'),
    });

    // Handlers
    const openCreate = () => {
        setEditing(null);
        form.reset({
            name: '',
            logo: '',
            contactName: '',
            phoneNumber: '',
            email: '',
            website: '',
            rating: 0,
        });
        setOpen(true);
    };

    const openEdit = (supplier: any) => {
        setEditing(supplier);
        form.reset({
            name: supplier.name || '',
            logo: supplier.logo || '',
            contactName: supplier.contactName || '',
            phoneNumber: supplier.phoneNumber || '',
            email: supplier.email || '',
            website: supplier.website || '',
            rating: Number(supplier.rating) || 0,
        });
        setOpen(true);
    };

    const onSubmit = (values: SupplierFormValues) => {
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const confirmDelete = () => {
        if (deleteId) deleteMutation.mutate({ id: deleteId });
    };

    // Filtering Logic
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) =>
            (supplier.name ?? '')
                .toLowerCase()
                .includes(searchQuery.toLowerCase()),
        );
    }, [suppliers, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const total = suppliers.length;
        const avgRating =
            total > 0
                ? suppliers.reduce((sum, s) => sum + Number(s.rating || 0), 0) /
                  total
                : 0;
        return { total, avgRating: avgRating.toFixed(1) };
    }, [suppliers]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý nhà cung cấp
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Quản lý thông tin liên hệ và đánh giá nhà cung cấp.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.supplier.list.invalidate()}
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
                                Thêm nhà cung cấp
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-display text-2xl">
                                    {editing
                                        ? 'Chỉnh sửa nhà cung cấp'
                                        : 'Thêm nhà cung cấp mới'}
                                </DialogTitle>
                            </DialogHeader>

                            <Form {...form}>
                                <form
                                    onSubmit={form.handleSubmit(onSubmit)}
                                    className="space-y-4 pt-4"
                                >
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Tên nhà cung cấp *
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ví dụ: Công ty TNHH..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="contactName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Tên liên hệ
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Nguyễn Văn A"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phoneNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Số điện thoại
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="0901234567"
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
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="contact@example.com"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="rating"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Đánh giá (0-5)
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={0}
                                                            max={5}
                                                            step={0.1}
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
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Website</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="logo"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Logo</FormLabel>
                                                <FormControl>
                                                    <ImageUpload
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        folder="suppliers"
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
                                            disabled={isPending}
                                        >
                                            {isPending && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                            {editing ? 'Cập nhật' : 'Tạo mới'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2">
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
                            Tổng số nhà cung cấp
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Đánh giá TB
                        </CardDescription>
                        <CardTitle className="font-display text-3xl flex items-center gap-2">
                            {stats.avgRating}{' '}
                            <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Đánh giá trung bình
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Tìm theo tên nhà cung cấp..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Suppliers Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold text-lg">
                                Không tìm thấy nhà cung cấp
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery
                                    ? 'Thử thay đổi bộ lọc tìm kiếm'
                                    : 'Hãy tạo nhà cung cấp đầu tiên'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Tên
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Liên hệ
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Điện thoại
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Email
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Đánh giá
                                        </th>
                                        <th className="text-right p-4 font-semibold text-sm">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredSuppliers.map((supplier) => (
                                        <tr
                                            key={supplier.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {supplier.logo ? (
                                                        <Image
                                                            src={supplier.logo}
                                                            alt={
                                                                supplier.name ??
                                                                'Supplier'
                                                            }
                                                            width={36}
                                                            height={36}
                                                            className="h-9 w-9 rounded-md object-cover border shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0 border">
                                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                    <div className="font-medium">
                                                        {supplier.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                {supplier.contactName || '-'}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {supplier.phoneNumber || '-'}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {supplier.email || '-'}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm font-medium">
                                                        {Number(
                                                            supplier.rating ||
                                                                0,
                                                        ).toFixed(1)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEdit(supplier)
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            setDeleteId(
                                                                supplier.id,
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
                            Xác nhận xóa nhà cung cấp
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa nhà cung cấp này? Hành động này
                            không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
