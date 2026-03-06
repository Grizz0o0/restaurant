'use client';

import { useMemo, useState } from 'react';
import {
    CalendarDays,
    Loader2,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    RefreshCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

const STATUSES: {
    value: ReservationStatus;
    label: string;
    variant: 'outline' | 'secondary' | 'default' | 'destructive';
    color: string;
}[] = [
    {
        value: 'PENDING',
        label: 'Chờ xác nhận',
        variant: 'outline',
        color: 'text-yellow-600',
    },
    {
        value: 'CONFIRMED',
        label: 'Đã xác nhận',
        variant: 'default',
        color: 'text-blue-600',
    },
    {
        value: 'COMPLETED',
        label: 'Hoàn thành',
        variant: 'secondary',
        color: 'text-green-600',
    },
    {
        value: 'CANCELLED',
        label: 'Đã hủy',
        variant: 'destructive',
        color: 'text-red-600',
    },
];

function StatusBadge({ status }: { status: string }) {
    const info = STATUSES.find((s) => s.value === status);
    return (
        <Badge variant={info?.variant ?? 'outline'}>
            {info?.label ?? status}
        </Badge>
    );
}

function formatDate(date: any) {
    try {
        return new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '-';
    }
}

function getNextActions(status: ReservationStatus) {
    switch (status) {
        case 'PENDING':
            return [
                {
                    label: 'Xác nhận',
                    value: 'CONFIRMED' as ReservationStatus,
                    icon: CheckCircle,
                    variant: 'default' as const,
                },
                {
                    label: 'Hủy',
                    value: 'CANCELLED' as ReservationStatus,
                    icon: XCircle,
                    variant: 'destructive' as const,
                },
            ];
        case 'CONFIRMED':
            return [
                {
                    label: 'Hoàn thành',
                    value: 'COMPLETED' as ReservationStatus,
                    icon: CheckCircle,
                    variant: 'default' as const,
                },
                {
                    label: 'Hủy',
                    value: 'CANCELLED' as ReservationStatus,
                    icon: XCircle,
                    variant: 'destructive' as const,
                },
            ];
        default:
            return [];
    }
}

export default function AdminReservationsPage() {
    const utils = trpc.useUtils();
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading } = trpc.reservation.list.useQuery({
        page: 1,
        limit: 100,
    });

    const reservations = (data?.items ?? []) as any[];

    const updateMutation = trpc.reservation.update.useMutation({
        onSuccess: () => {
            toast.success('Đã cập nhật trạng thái đặt bàn');
            utils.reservation.list.invalidate();
        },
        onError: (err) => {
            toast.error(`Lỗi: ${err.message}`);
        },
    });

    const handleStatusChange = (id: string, status: ReservationStatus) => {
        updateMutation.mutate({ id, data: { status } });
    };

    const filtered = useMemo(() => {
        return reservations.filter((r) => {
            const matchStatus =
                filterStatus === 'all' || r.status === filterStatus;
            const matchSearch =
                searchQuery === '' ||
                r.user?.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                r.table?.tableNumber
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [reservations, filterStatus, searchQuery]);

    const stats = useMemo(
        () => ({
            total: reservations.length,
            pending: reservations.filter((r) => r.status === 'PENDING').length,
            confirmed: reservations.filter((r) => r.status === 'CONFIRMED')
                .length,
            completed: reservations.filter((r) => r.status === 'COMPLETED')
                .length,
        }),
        [reservations],
    );

    return (
        <div className="flex flex-col p-6 w-full max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
                        Quản lý Đặt bàn
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Xem và xử lý các yêu cầu đặt bàn từ khách hàng.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => utils.reservation.list.invalidate()}
                    className="gap-2"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Làm mới
                </Button>
            </div>

            {/* Stats */}
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
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Tổng đặt bàn
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Chờ xác nhận
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.pending}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Cần xử lý
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Đã xác nhận
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.confirmed}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Đang chờ khách
                            đến
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs uppercase tracking-wide">
                            Hoàn thành
                        </CardDescription>
                        <CardTitle className="font-display text-3xl">
                            {stats.completed}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> Đã phục vụ
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Tìm theo tên khách hoặc số bàn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-52">
                        <SelectValue placeholder="Lọc theo trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        {STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
                            <h3 className="font-semibold text-lg">
                                Không có đặt bàn nào
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'Thử thay đổi bộ lọc tìm kiếm'
                                    : 'Chưa có yêu cầu đặt bàn nào'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Khách hàng
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Bàn
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Thời gian
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Số khách
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Trạng thái
                                        </th>
                                        <th className="text-left p-4 font-semibold text-sm">
                                            Ghi chú
                                        </th>
                                        <th className="text-right p-4 font-semibold text-sm">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((r) => {
                                        const actions = getNextActions(
                                            r.status,
                                        );
                                        return (
                                            <tr
                                                key={r.id}
                                                className="hover:bg-muted/30 transition-colors"
                                            >
                                                <td className="p-4">
                                                    <div className="font-medium text-sm">
                                                        {r.user?.name ??
                                                            'Khách vãng lai'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {r.user?.email ?? ''}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-sm font-medium">
                                                        Bàn{' '}
                                                        {r.table?.tableNumber ??
                                                            '-'}
                                                    </span>
                                                    {r.table?.capacity && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Sức chứa:{' '}
                                                            {r.table.capacity}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground">
                                                    {formatDate(
                                                        r.reservationTime,
                                                    )}
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {r.guests}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <StatusBadge
                                                        status={r.status}
                                                    />
                                                </td>
                                                <td className="p-4 text-sm text-muted-foreground max-w-40 truncate">
                                                    {r.notes ?? '—'}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {actions.map(
                                                            (action) => {
                                                                const Icon =
                                                                    action.icon;
                                                                return (
                                                                    <Button
                                                                        key={
                                                                            action.value
                                                                        }
                                                                        variant={
                                                                            action.variant
                                                                        }
                                                                        size="sm"
                                                                        className="gap-1 text-xs"
                                                                        disabled={
                                                                            updateMutation.isPending
                                                                        }
                                                                        onClick={() =>
                                                                            handleStatusChange(
                                                                                r.id,
                                                                                action.value,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Icon className="h-3.5 w-3.5" />
                                                                        {
                                                                            action.label
                                                                        }
                                                                    </Button>
                                                                );
                                                            },
                                                        )}
                                                        {actions.length ===
                                                            0 && (
                                                            <span className="text-xs text-muted-foreground italic">
                                                                —
                                                            </span>
                                                        )}
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
        </div>
    );
}
