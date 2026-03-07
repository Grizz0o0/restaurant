'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Plus,
    Pencil,
    Loader2,
    Search,
    Users as UsersIcon,
    ShieldOff,
    ShieldCheck,
    ChevronRight,
    Mail,
    Phone,
    Calendar,
    ShoppingBag,
    Banknote,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
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
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ImageUpload } from '@/components/ui/image-upload';

const userSchema = z.object({
    name: z.string().trim().min(1, 'Tên không được trống').max(200),
    email: z.string().email('Email không hợp lệ'),
    phoneNumber: z.string().trim().min(10, 'Số điện thoại không hợp lệ'),
    password: z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .optional()
        .or(z.literal('')),
    roleId: z.string().min(1, 'Vui lòng chọn vai trò'),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    avatar: z.string().optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof userSchema>;

// ----- Status Badge -----
function UserStatusBadge({ status }: { status?: string }) {
    if (status === 'ACTIVE')
        return (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
                Hoạt động
            </Badge>
        );
    if (status === 'BLOCKED')
        return (
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200">
                Bị chặn
            </Badge>
        );
    return <Badge variant="secondary">Không hoạt động</Badge>;
}

// ----- Profile Drawer -----
function UserProfileDrawer({
    user,
    open,
    onClose,
    onEdit,
    roles,
}: {
    user: any | null;
    open: boolean;
    onClose: () => void;
    onEdit: () => void;
    roles: any[];
}) {
    const utils = trpc.useUtils();

    // Fetch order history for this user
    const { data: ordersData, isLoading: isLoadingOrders } =
        trpc.order.list.useQuery(
            { page: 1, limit: 100, userId: user?.id },
            { enabled: !!user?.id && open },
        );

    const orders = ordersData?.data || [];
    const totalSpend = orders
        .filter((o: any) => o.status === 'COMPLETED')
        .reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);

    const banMutation = trpc.admin.banUser.useMutation({
        onSuccess: () => {
            toast.success('Đã khóa tài khoản người dùng');
            utils.user.list.invalidate();
            onClose();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const unbanMutation = trpc.admin.unbanUser.useMutation({
        onSuccess: () => {
            toast.success('Đã gỡ khóa tài khoản');
            utils.user.list.invalidate();
            onClose();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const [confirmBan, setConfirmBan] = useState(false);
    const [confirmUnban, setConfirmUnban] = useState(false);

    const roleName = roles.find((r) => r.id === user?.roleId)?.name || 'N/A';

    const formatVnd = (v: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(v);

    if (!user) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                    <SheetHeader className="pb-4">
                        <SheetTitle>Hồ sơ khách hàng</SheetTitle>
                    </SheetHeader>

                    {/* Profile Header */}
                    <div className="flex flex-col items-center gap-3 py-6 border-b">
                        <Avatar className="h-20 w-20 border-2 border-primary/20">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                {user.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">
                                {user.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 justify-center flex-wrap">
                                <Badge variant="outline">{roleName}</Badge>
                                <UserStatusBadge status={user.status} />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="py-4 space-y-3 border-b">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Thông tin liên hệ
                        </h4>
                        <div className="flex items-center gap-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{user.email}</span>
                        </div>
                        {user.phoneNumber && (
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>{user.phoneNumber}</span>
                            </div>
                        )}
                        {user.createdAt && (
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span>
                                    Tham gia{' '}
                                    {format(
                                        new Date(user.createdAt),
                                        'dd MMM yyyy',
                                        { locale: vi },
                                    )}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Order Stats */}
                    <div className="py-4 space-y-3 border-b">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Lịch sử giao dịch
                        </h4>
                        {isLoadingOrders ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShoppingBag className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs text-muted-foreground">
                                            Tổng đơn
                                        </span>
                                    </div>
                                    <p className="text-xl font-bold">
                                        {orders.length}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Banknote className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs text-muted-foreground">
                                            Đã chi
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold truncate">
                                        {formatVnd(totalSpend)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={onEdit}
                        >
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa thông tin
                        </Button>

                        {user.status === 'BLOCKED' ? (
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => setConfirmUnban(true)}
                            >
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Gỡ khóa tài khoản
                            </Button>
                        ) : (
                            <Button
                                className="w-full"
                                variant="destructive"
                                onClick={() => setConfirmBan(true)}
                            >
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Khóa tài khoản
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Ban Confirmation */}
            <AlertDialog open={confirmBan} onOpenChange={setConfirmBan}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Xác nhận khóa tài khoản
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Người dùng <strong>{user.name}</strong> sẽ bị đăng
                            xuất khỏi tất cả thiết bị ngay lập tức và không thể
                            đăng nhập lại.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => {
                                banMutation.mutate({ userId: user.id });
                                setConfirmBan(false);
                            }}
                        >
                            {banMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Khóa tài khoản
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Unban Confirmation */}
            <AlertDialog open={confirmUnban} onOpenChange={setConfirmUnban}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Gỡ khóa tài khoản</AlertDialogTitle>
                        <AlertDialogDescription>
                            Xác nhận gỡ khóa tài khoản của{' '}
                            <strong>{user.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => {
                                unbanMutation.mutate({ userId: user.id });
                                setConfirmUnban(false);
                            }}
                        >
                            Gỡ khóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ----- Main Page -----
export default function AdminUsersPage() {
    const utils = trpc.useUtils();

    const { data: usersData, isLoading } = trpc.user.list.useQuery({
        page: 1,
        limit: 100,
    });

    const { data: rolesData } = trpc.role.list.useQuery({
        page: 1,
        limit: 100,
    });

    const users = usersData?.data || [];
    const roles = rolesData?.data || [];

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            roleId: '',
            status: 'ACTIVE',
            avatar: '',
        },
    });

    // Mutations
    const createMutation = trpc.user.create.useMutation({
        onSuccess: () => {
            toast.success('Đã tạo người dùng mới');
            utils.user.list.invalidate();
            setOpen(false);
            form.reset();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const updateMutation = trpc.user.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật người dùng');
            utils.user.list.invalidate();
            setOpen(false);
            setEditing(null);
            form.reset();
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    // Handlers
    const openCreate = () => {
        setEditing(null);
        form.reset({
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            roleId: roles[0]?.id ?? '',
            status: 'ACTIVE',
            avatar: '',
        });
        setOpen(true);
    };

    const openEdit = (user: any) => {
        setDrawerOpen(false);
        setEditing(user);
        form.reset({
            name: user.name || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || '',
            password: '',
            roleId: user.roleId || '',
            status: user.status || 'ACTIVE',
            avatar: user.avatar || '',
        });
        setOpen(true);
    };

    const onSubmit = (values: UserFormValues) => {
        if (editing) {
            const updateData: any = { ...values };
            if (!updateData.password) delete updateData.password;
            updateMutation.mutate({
                params: { userId: editing.id },
                body: updateData,
            });
        } else {
            createMutation.mutate({
                ...values,
                password: values.password || 'defaultpassword123',
            });
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchName =
                (user.name ?? '')
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                (user.email ?? '')
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());
            const matchRole =
                filterRole === 'all' || user.roleId === filterRole;
            const matchStatus =
                filterStatus === 'all' || user.status === filterStatus;
            return matchName && matchRole && matchStatus;
        });
    }, [users, searchQuery, filterRole, filterStatus]);

    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter((u) => u.status === 'ACTIVE').length;
        const blocked = users.filter((u) => u.status === 'BLOCKED').length;
        return { total, active, blocked };
    }, [users]);

    const getRoleName = (roleId: string) => {
        return roles.find((r) => r.id === roleId)?.name || 'N/A';
    };

    const handleRowClick = (user: any) => {
        setSelectedUser(user);
        setDrawerOpen(true);
    };

    return (
        <div className="flex flex-col p-4 md:p-6 w-full max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Quản lý khách hàng
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Xem hồ sơ, lịch sử giao dịch và quản lý tài khoản.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => utils.user.list.invalidate()}
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
                                Thêm người dùng
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">
                                    {editing
                                        ? 'Chỉnh sửa người dùng'
                                        : 'Thêm người dùng mới'}
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
                                                <FormLabel>Tên *</FormLabel>
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Email *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="user@example.com"
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
                                                        Số điện thoại *
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
                                    {!editing && (
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Mật khẩu *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="••••••••"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="roleId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Vai trò *
                                                    </FormLabel>
                                                    <Select
                                                        value={
                                                            field.value || ''
                                                        }
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn vai trò" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {roles.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role.id
                                                                        }
                                                                        value={
                                                                            role.id
                                                                        }
                                                                    >
                                                                        {
                                                                            role.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Trạng thái
                                                    </FormLabel>
                                                    <Select
                                                        value={
                                                            field.value ||
                                                            'ACTIVE'
                                                        }
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
                                                            <SelectItem value="ACTIVE">
                                                                Hoạt động
                                                            </SelectItem>
                                                            <SelectItem value="INACTIVE">
                                                                Không hoạt động
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
                                        name="avatar"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Ảnh đại diện
                                                </FormLabel>
                                                <FormControl>
                                                    <ImageUpload
                                                        value={field.value}
                                                        onChange={
                                                            field.onChange
                                                        }
                                                        folder="avatars"
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

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Tổng số
                        </CardDescription>
                        <CardTitle className="text-3xl">
                            {stats.total}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Tổng số người dùng
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Hoạt động
                        </CardDescription>
                        <CardTitle className="text-3xl">
                            {stats.active}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Tài khoản đang hoạt động
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Bị khóa
                        </CardDescription>
                        <CardTitle className="text-3xl">
                            {stats.blocked}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            Tài khoản bị chặn
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Tìm theo tên hoặc email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Lọc vai trò" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả vai trò</SelectItem>
                        {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                                {role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="Lọc trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                        <SelectItem value="BLOCKED">Bị khóa</SelectItem>
                        <SelectItem value="INACTIVE">
                            Không hoạt động
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <UsersIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="font-semibold text-lg">
                                Không tìm thấy người dùng
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery ||
                                filterRole !== 'all' ||
                                filterStatus !== 'all'
                                    ? 'Thử thay đổi bộ lọc tìm kiếm'
                                    : 'Chưa có người dùng nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Người dùng
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm hidden md:table-cell">
                                            Số điện thoại
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Vai trò
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Trạng thái
                                        </th>
                                        <th className="text-right p-4 font-semibold text-sm">
                                            Hồ sơ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                                            onClick={() => handleRowClick(user)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border shrink-0">
                                                        <AvatarImage
                                                            src={
                                                                user.avatar ||
                                                                undefined
                                                            }
                                                        />
                                                        <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                                                            {user.name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                                '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm hidden md:table-cell text-muted-foreground">
                                                {user.phoneNumber || '—'}
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="outline">
                                                    {getRoleName(user.roleId)}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <UserStatusBadge
                                                    status={user.status}
                                                />
                                            </td>
                                            <td className="p-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRowClick(user);
                                                    }}
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Profile Drawer */}
            <UserProfileDrawer
                user={selectedUser}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onEdit={() => openEdit(selectedUser)}
                roles={roles}
            />
        </div>
    );
}
