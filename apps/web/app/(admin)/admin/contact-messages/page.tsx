'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, Mail, Phone, Eye, Trash2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
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

export default function ContactMessagesPage() {
    const utils = trpc.useUtils();
    const [page, setPage] = useState(1);
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const { data, isLoading, isFetching } = trpc.contact.list.useQuery({
        page,
        limit: 10,
    });

    const markAsReadMutation = trpc.contact.markAsRead.useMutation({
        onSuccess: () => {
            utils.contact.list.invalidate();
        },
    });

    const deleteMutation = trpc.contact.delete.useMutation({
        onSuccess: () => {
            toast.success('Đã xóa tin nhắn');
            utils.contact.list.invalidate();
            setDeleteId(null);
        },
        onError: (err) => toast.error(err.message),
    });

    const handleView = (message: any) => {
        setSelectedMessage(message);
        if (message.status === 'UNREAD') {
            markAsReadMutation.mutate({ id: message.id });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-100 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Tin nhắn liên hệ
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Xem và quản lý các tin nhắn từ khách hàng gửi qua form
                        liên hệ.
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => utils.contact.list.invalidate()}
                    disabled={isFetching}
                >
                    <RefreshCcw
                        className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
                    />
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Danh sách tin nhắn ({data?.pagination.totalItems || 0})
                    </CardTitle>
                    <CardDescription>
                        Các tin nhắn mới nhất sẽ hiển thị đầu tiên.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-50">
                                        Người gửi
                                    </TableHead>
                                    <TableHead>Thông tin liên hệ</TableHead>
                                    <TableHead>Ngày gửi</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-right">
                                        Thao tác
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={5}
                                            className="h-32 text-center text-muted-foreground"
                                        >
                                            Không có tin nhắn nào.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data?.data.map((item) => (
                                        <TableRow
                                            key={item.id}
                                            className={`cursor-pointer transition-colors ${item.status === 'UNREAD' ? 'bg-primary/5 hover:bg-primary/10 font-medium' : 'hover:bg-muted/50'}`}
                                            onClick={() => handleView(item)}
                                        >
                                            <TableCell className="font-semibold">
                                                {item.name}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1 text-xs">
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Mail className="h-3 w-3" />
                                                        <span className="truncate max-w-37.5">
                                                            {item.email}
                                                        </span>
                                                    </div>
                                                    {item.phone && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            <span>
                                                                {item.phone}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(
                                                    new Date(item.createdAt),
                                                    'HH:mm dd/MM/yyyy',
                                                    { locale: vi },
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        item.status === 'UNREAD'
                                                            ? 'hero'
                                                            : 'outline'
                                                    }
                                                >
                                                    {item.status === 'UNREAD'
                                                        ? 'Mới'
                                                        : 'Đã đọc'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className="text-right"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleView(item)
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() =>
                                                            setDeleteId(item.id)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {data && data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between py-4">
                            <p className="text-sm text-muted-foreground">
                                Hiển thị {(page - 1) * 10 + 1} -{' '}
                                {Math.min(
                                    page * 10,
                                    data.pagination.totalItems,
                                )}{' '}
                                trong tổng số {data.pagination.totalItems}
                            </p>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!data.pagination.hasPrev}
                                >
                                    Trước
                                </Button>
                                <div className="flex items-center justify-center text-sm font-medium px-4 h-9 rounded-md border bg-muted/20">
                                    {page} / {data.pagination.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!data.pagination.hasNext}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Message Dialog */}
            <Dialog
                open={!!selectedMessage}
                onOpenChange={(v) => !v && setSelectedMessage(null)}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Chi tiết liên hệ
                            {selectedMessage?.status === 'UNREAD' && (
                                <Badge variant="hero">Mới</Badge>
                            )}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedMessage && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 border p-4 rounded-xl bg-muted/30">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        Người gửi
                                    </p>
                                    <p className="font-semibold text-sm">
                                        {selectedMessage.name}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        Ngày gửi
                                    </p>
                                    <p className="font-medium text-sm">
                                        {format(
                                            new Date(selectedMessage.createdAt),
                                            'HH:mm - dd/MM/yyyy',
                                            { locale: vi },
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        Email
                                    </p>
                                    <p className="font-medium text-sm text-primary underline underline-offset-4 decoration-primary/30">
                                        {selectedMessage.email}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                        Số điện thoại
                                    </p>
                                    <p className="font-medium text-sm">
                                        {selectedMessage.phone || 'Không có'}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider ml-1">
                                    Nội dung tin nhắn
                                </p>
                                <div className="bg-background p-5 rounded-xl text-sm whitespace-pre-wrap leading-relaxed border shadow-sm min-h-30">
                                    {selectedMessage.message}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    className="w-full"
                                    onClick={() => setSelectedMessage(null)}
                                >
                                    Đóng
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteId}
                onOpenChange={(v) => !v && setDeleteId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tin nhắn này không? Hành
                            động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
                            onClick={() =>
                                deleteId &&
                                deleteMutation.mutate({ id: deleteId })
                            }
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Xóa vĩnh viễn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
