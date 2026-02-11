'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    CheckCircle,
    XCircle,
    RefreshCw,
    Home,
    ShoppingBag,
    Clock,
    CreditCard,
    Copy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
// import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function PaymentResultPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // -- MoMo Params --
    const resultCode = searchParams.get('resultCode');
    const message = searchParams.get('message');

    const transId = searchParams.get('transId');
    const amount = Number(searchParams.get('amount'));
    const payType = searchParams.get('payType');
    const responseTime = searchParams.get('responseTime'); // Timestamp format
    const orderInfo = searchParams.get('orderInfo');

    // Extract internal Order ID from orderInfo string "Thanh toan don hang <UUID>"
    // Fallback to searching in orderInfo if needed
    const internalOrderId = orderInfo?.split(' ').pop();

    const isSuccess = resultCode === '0';

    // -- State --
    const [isChecking, setIsChecking] = useState(false);
    const checkStatusMutation = trpc.payment.checkStatus.useMutation({
        onSuccess: (data) => {
            if (data.status === 'SUCCESS') {
                toast.success('Đồng bộ trạng thái thành công!');
            } else {
                toast.error(
                    'Trạng thái vẫn chưa cập nhật. Vui lòng thử lại sau.',
                );
            }
        },
        onError: (err) => {
            toast.error('Lỗi khi kiểm tra trạng thái: ' + err.message);
        },
    });

    const handleCheckStatus = () => {
        if (!internalOrderId) return;
        setIsChecking(true);
        checkStatusMutation.mutate(
            { orderId: internalOrderId },
            {
                onSettled: () => setIsChecking(false),
            },
        );
    };

    // Format Date
    const dateStr = responseTime
        ? new Date(Number(responseTime)).toLocaleString('vi-VN')
        : new Date().toLocaleString('vi-VN');

    return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg shadow-lg border-t-4 border-t-pink-600">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-white p-3 rounded-full shadow-sm inline-block">
                        {isSuccess ? (
                            <CheckCircle className="h-16 w-16 text-green-500" />
                        ) : (
                            <XCircle className="h-16 w-16 text-red-500" />
                        )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        {isSuccess
                            ? 'Thanh toán thành công'
                            : 'Giao dịch thất bại'}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">
                        {message}
                    </p>
                    {isSuccess && (
                        <div className="mt-4 text-3xl font-extrabold text-pink-600">
                            {new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                            }).format(amount || 0)}
                        </div>
                    )}
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    <div className="bg-muted/40 p-4 rounded-lg space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <ShoppingBag size={14} /> Mã đơn hàng
                            </span>
                            <span className="font-medium font-mono">
                                {internalOrderId || 'N/A'}
                            </span>
                        </div>

                        <Separator className="bg-gray-200" />

                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <CreditCard size={14} /> Mã giao dịch MoMo
                            </span>
                            <span className="font-medium font-mono select-all">
                                {transId || 'N/A'}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <RefreshCw size={14} /> Nguồn tiền
                            </span>
                            <span className="font-medium capitalize">
                                {payType || 'Ví MoMo'}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-2">
                                <Clock size={14} /> Thời gian
                            </span>
                            <span className="font-medium">{dateStr}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Nội dung
                            </span>
                            <span
                                className="font-medium truncate max-w-50"
                                title={orderInfo || ''}
                            >
                                {orderInfo}
                            </span>
                        </div>
                    </div>

                    {/* Warning for PENDING/Handling */}
                    {isSuccess && (
                        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-100 flex gap-2">
                            <RefreshCw
                                size={14}
                                className="mt-0.5 shrink-0 animate-spin-slow"
                            />
                            <p>
                                Nếu trạng thái đơn hàng chưa cập nhật, vui lòng
                                nhấn nút <strong>Kiểm tra trạng thái</strong>{' '}
                                bên dưới để đồng bộ dữ liệu.
                            </p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-3 bg-gray-50/50 p-6">
                    <Button
                        className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                        size="lg"
                        onClick={handleCheckStatus}
                        disabled={isChecking || !internalOrderId}
                    >
                        {isChecking ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />{' '}
                                Đang kiểm tra...
                            </>
                        ) : (
                            'Kiểm tra trạng thái'
                        )}
                    </Button>

                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.push(
                                    internalOrderId
                                        ? `/profile/orders/${internalOrderId}`
                                        : '/profile/orders',
                                )
                            }
                        >
                            Xem đơn hàng
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                        >
                            <Home className="mr-2 h-4 w-4" /> Trang chủ
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
