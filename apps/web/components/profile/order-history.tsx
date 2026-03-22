'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Loader2,
    Package,
    ChevronDown,
    Star,
    MessageSquare,
    Truck,
    CheckCircle2,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import { useAuth } from '@/hooks/domain/use-auth';
import { RoleName } from '@repo/constants';
import { useSocket } from '@/providers/socket-provider';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { formatCurrency } from '@/lib/utils/format';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const statusMap: Record<string, { label: string; color: string }> = {
    PENDING_CONFIRMATION: {
        label: 'Chờ xác nhận',
        color: 'bg-yellow-100 text-yellow-800',
    },
    CONFIRMED: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    PREPARING: {
        label: 'Đang chuẩn bị',
        color: 'bg-indigo-100 text-indigo-800',
    },
    READY_FOR_PICKUP: {
        label: 'Sẵn sàng giao',
        color: 'bg-purple-100 text-purple-800',
    },
    DELIVERING: {
        label: 'Đang giao hàng',
        color: 'bg-blue-100 text-blue-800',
    },
    DELIVERED: {
        label: 'Đã giao hàng',
        color: 'bg-emerald-100 text-emerald-800',
    },
    COMPLETED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
    RETURNED: {
        label: 'Khách trả hàng',
        color: 'bg-orange-100 text-orange-800',
    },
    BOOMED: { label: 'Khách bùng hàng', color: 'bg-rose-100 text-rose-800' },
    CANCELLED: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
};

// ---- Star Picker ----
function StarPicker({
    value,
    onChange,
}: {
    value: number;
    onChange: (v: number) => void;
}) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`${star} sao`}
                >
                    <Star
                        className={`h-8 w-8 transition-colors ${
                            star <= (hovered || value)
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-muted text-muted-foreground/30'
                        }`}
                    />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                    {
                        ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][
                            value
                        ]
                    }
                </span>
            )}
        </div>
    );
}

// ---- Review Dialog ----
function ReviewDialog({
    open,
    onClose,
    dishId,
    dishName,
}: {
    open: boolean;
    onClose: () => void;
    dishId: string;
    dishName: string;
}) {
    const utils = trpc.useUtils();
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');

    const createReview = trpc.review.create.useMutation({
        onSuccess: () => {
            toast.success('Cảm ơn bạn đã đánh giá! ⭐');
            utils.review.list.invalidate();
            utils.review.myReviews.invalidate();
            onClose();
            setRating(5);
            setContent('');
        },
        onError: (err) => toast.error(`Lỗi: ${err.message}`),
    });

    const handleSubmit = () => {
        if (!content.trim()) {
            toast.warning('Vui lòng nhập nội dung đánh giá');
            return;
        }
        createReview.mutate({ dishId, rating, content: content.trim() });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Đánh giá món ăn
                    </DialogTitle>
                    <DialogDescription>
                        Chia sẻ cảm nhận của bạn về{' '}
                        <span className="font-semibold text-foreground">
                            {dishName}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Chất lượng
                        </Label>
                        <StarPicker value={rating} onChange={setRating} />
                    </div>

                    <div className="space-y-2">
                        <Label
                            htmlFor="review-content"
                            className="text-sm font-medium"
                        >
                            Nhận xét
                        </Label>
                        <Textarea
                            id="review-content"
                            placeholder="Món ăn thế nào? Khẩu phần, hương vị, trình bày..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-30 resize-none"
                            maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {content.length}/1000
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={createReview.isPending || rating === 0}
                        className="gap-2"
                    >
                        {createReview.isPending && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Gửi đánh giá
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ---- Shipper Actions ----
function ShipperActions({
    orderId,
    status,
    onSuccess,
}: {
    orderId: string;
    status: string;
    onSuccess: () => void;
}) {
    const [verificationCode, setVerificationCode] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const updateStatus = trpc.order.updateStatus.useMutation({
        onSuccess: () => {
            toast.success('Cập nhật trạng thái thành công');
            onSuccess();
            setIsUpdating(false);
            setVerificationCode('');
        },
        onError: (err) => {
            toast.error(err.message);
            setIsUpdating(false);
        },
    });

    const handleUpdate = (newStatus: string) => {
        if (newStatus === 'COMPLETED' && !verificationCode) {
            toast.error('Vui lòng nhập mã xác nhận từ khách hàng');
            return;
        }
        setIsUpdating(true);
        updateStatus.mutate({
            orderId,
            status: newStatus,
            verificationCode:
                newStatus === 'COMPLETED' ? verificationCode : undefined,
        });
    };

    if (status === 'READY_FOR_PICKUP') {
        return (
            <Button
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleUpdate('DELIVERING')}
                disabled={isUpdating}
            >
                <Truck className="h-4 w-4" />
                Bắt đầu giao
            </Button>
        );
    }

    if (status === 'DELIVERING') {
        return (
            <div className="flex flex-col gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Mã xác nhận (6 số)"
                        className="flex-1 h-9 px-3 text-sm rounded-md border border-input bg-background"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <Button
                        size="sm"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleUpdate('COMPLETED')}
                        disabled={isUpdating}
                    >
                        {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4" />
                        )}
                        Giao xong
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => handleUpdate('RETURNED')}
                        disabled={isUpdating}
                    >
                        <RotateCcw className="h-4 w-4" />
                        Trả hàng
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleUpdate('BOOMED')}
                        disabled={isUpdating}
                    >
                        <XCircle className="h-4 w-4" />
                        Bùng hàng
                    </Button>
                </div>
            </div>
        );
    }

    return null;
}

// ---- Order History ----
export function OrderHistory() {
    const { user } = useAuth();
    const isShipper = user?.role?.name === RoleName.Shipper;
    const [page, setPage] = useState(1);
    const {
        data: initialData,
        isLoading,
        refetch,
    } = trpc.order.myOrders.useQuery({ page, limit: 10 });

    const [reviewTarget, setReviewTarget] = useState<{
        dishId: string;
        dishName: string;
    } | null>(null);

    const { socket } = useSocket();

    // Fetch user's existing reviews to know which dishes were already reviewed
    const { data: myReviewsData } = trpc.review.myReviews.useQuery({
        page: 1,
        limit: 100,
    });
    const reviewedDishIds = new Set(
        (myReviewsData?.data ?? []).map((r) => r.dishId),
    );

    useEffect(() => {
        if (!socket) return;
        socket.on('order_updated', (data) => {
            toast.info(
                `Đơn hàng #${data.orderId.slice(-6).toUpperCase()} đã cập nhật trạng thái: ${statusMap[data.status]?.label || data.status}`,
            );
            refetch();
        });
        return () => {
            socket.off('order_updated');
        };
    }, [socket, refetch]);

    const orders = initialData?.data || [];
    const pagination = initialData?.pagination;

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-card">
                <div className="rounded-full bg-muted/50 p-4 mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Chưa có đơn hàng nào</h3>
                <p className="text-muted-foreground mb-4">
                    Bạn chưa đặt đơn hàng nào. Hãy khám phá thực đơn của chúng
                    tôi!
                </p>
                <Button asChild variant="hero">
                    <a href="/menu">Xem thực đơn</a>
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {orders.map((order) => {
                    const isCompleted = order.status === 'COMPLETED';
                    return (
                        <Collapsible
                            key={order.id}
                            className="border rounded-lg bg-card overflow-hidden"
                        >
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-sm font-medium">
                                            #{order.id.slice(-6).toUpperCase()}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={`${statusMap[order.status]?.color || 'bg-gray-100 text-gray-800'} border-none`}
                                        >
                                            {statusMap[order.status]?.label ||
                                                order.status}
                                        </Badge>
                                        {isCompleted && (
                                            <span className="text-xs text-emerald-600 font-medium">
                                                ✦ Có thể đánh giá
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {format(
                                            new Date(order.createdAt),
                                            'HH:mm dd/MM/yyyy',
                                            {
                                                locale: vi,
                                            },
                                        )}
                                    </p>
                                    {(order.deliveryAddress ||
                                        order.deliveryPhone) && (
                                        <div className="mt-2 space-y-1 text-sm border-t pt-2 border-dashed">
                                            {order.receiverName && (
                                                <div className="flex items-center gap-2 text-foreground font-medium">
                                                    <span className="text-xs text-muted-foreground">
                                                        Người nhận:
                                                    </span>{' '}
                                                    {order.receiverName}
                                                </div>
                                            )}
                                            {order.deliveryPhone && (
                                                <div className="flex items-center gap-2 text-foreground">
                                                    <span className="text-xs text-muted-foreground">
                                                        SĐT:
                                                    </span>{' '}
                                                    {order.deliveryPhone}
                                                </div>
                                            )}
                                            {order.deliveryAddress && (
                                                <div className="flex items-start gap-2 text-foreground">
                                                    <span className="text-xs text-muted-foreground mt-0.5">
                                                        Địa chỉ:
                                                    </span>
                                                    <span className="flex-1">
                                                        {order.deliveryAddress}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!isShipper &&
                                        order.status === 'DELIVERING' &&
                                        order.deliveryCode && (
                                            <div className="mt-2 p-2 bg-blue-50 text-blue-700 rounded border border-blue-100 text-xs font-semibold flex items-center gap-2">
                                                <div className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] uppercase">
                                                    Mã giao hàng
                                                </div>
                                                <span className="text-sm tracking-widest">
                                                    {order.deliveryCode}
                                                </span>
                                            </div>
                                        )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                                    {isShipper && (
                                        <ShipperActions
                                            orderId={order.id}
                                            status={order.status}
                                            onSuccess={refetch}
                                        />
                                    )}
                                    <div className="text-right">
                                        <p className="text-sm font-medium">
                                            Tổng tiền
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                            {formatCurrency(
                                                Number(order.totalAmount),
                                            )}
                                        </p>
                                    </div>
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 data-[state=open]:rotate-180 transition-transform duration-200"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                            <span className="sr-only">
                                                Toggle details
                                            </span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                            </div>

                            <CollapsibleContent>
                                <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
                                    <div className="space-y-3">
                                        {order.items.map(
                                            (item: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 gap-2 text-sm border-b border-muted last:border-0"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-muted w-8 h-8 rounded flex items-center justify-center text-xs font-medium shrink-0">
                                                            {item.quantity}x
                                                        </div>
                                                        <span className="font-medium line-clamp-2">
                                                            {item.dishName}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pl-11 sm:pl-0">
                                                        {item.price && (
                                                            <span className="text-muted-foreground font-medium">
                                                                {formatCurrency(
                                                                    Number(
                                                                        item.price,
                                                                    ) *
                                                                        item.quantity,
                                                                )}
                                                            </span>
                                                        )}
                                                        {isCompleted &&
                                                            item.dishId &&
                                                            (reviewedDishIds.has(
                                                                item.dishId,
                                                            ) ? (
                                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                                    <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                                                                    Đã đánh giá
                                                                </span>
                                                            ) : (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-7 px-2 text-xs gap-1 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                                                    onClick={() =>
                                                                        setReviewTarget(
                                                                            {
                                                                                dishId: item.dishId,
                                                                                dishName:
                                                                                    item.dishName,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                                    Đánh giá
                                                                </Button>
                                                            ))}
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination.hasPrev}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                        >
                            Trước
                        </Button>
                        <span className="flex items-center text-sm font-medium">
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!pagination.hasNext}
                            onClick={() => setPage((p) => p + 1)}
                        >
                            Sau
                        </Button>
                    </div>
                )}
            </div>

            {/* Review Dialog */}
            {reviewTarget && (
                <ReviewDialog
                    open={!!reviewTarget}
                    onClose={() => setReviewTarget(null)}
                    dishId={reviewTarget.dishId}
                    dishName={reviewTarget.dishName}
                />
            )}
        </>
    );
}
