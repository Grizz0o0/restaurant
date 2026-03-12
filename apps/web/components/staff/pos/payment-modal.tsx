'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
    Banknote,
    CreditCard,
    QrCode,
    CheckCircle2,
    Loader2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { PrintReceipt, PrintReceiptProps } from './print-receipt';

type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** All active order IDs for this table that need to be marked COMPLETED */
    orderIds: string[];
    totalAmount: number;
    tableName: string;
    onPaymentComplete: () => void;
}

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000, 1_000_000];

const methodConfig: {
    id: PaymentMethod;
    label: string;
    icon: React.ReactNode;
    color: string;
}[] = [
    {
        id: 'CASH',
        label: 'Tiền mặt',
        icon: <Banknote className="h-5 w-5" />,
        color: 'border-emerald-400 bg-emerald-50 text-emerald-700 data-[selected=true]:bg-emerald-500 data-[selected=true]:text-white data-[selected=true]:border-emerald-500',
    },
    {
        id: 'TRANSFER',
        label: 'Chuyển khoản',
        icon: <QrCode className="h-5 w-5" />,
        color: 'border-blue-400 bg-blue-50 text-blue-700 data-[selected=true]:bg-blue-500 data-[selected=true]:text-white data-[selected=true]:border-blue-500',
    },
    {
        id: 'CARD',
        label: 'Thẻ / POS',
        icon: <CreditCard className="h-5 w-5" />,
        color: 'border-violet-400 bg-violet-50 text-violet-700 data-[selected=true]:bg-violet-500 data-[selected=true]:text-white data-[selected=true]:border-violet-500',
    },
];

export function PaymentModal({
    open,
    onOpenChange,
    orderIds,
    totalAmount,
    tableName,
    onPaymentComplete,
}: PaymentModalProps) {
    const [method, setMethod] = useState<PaymentMethod>('CASH');
    const [cashInput, setCashInput] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [receiptData, setReceiptData] = useState<PrintReceiptProps | null>(
        null,
    );

    const clearCart = usePosStore((s) => s.clearCart);

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    const parsedCash = parseInt(cashInput.replace(/\D/g, ''), 10) || 0;
    const change = parsedCash - totalAmount;
    const isEnough = method !== 'CASH' || parsedCash >= totalAmount;

    const utils = trpc.useUtils();

    const updateStatusMutation = trpc.order.updateStatus.useMutation();

    // Query to get all order items across the selected active orders
    const { data: ordersData } = trpc.order.list.useQuery(
        { page: 1, limit: 100 },
        { enabled: open && orderIds.length > 0 },
    );

    const handleConfirmPayment = async () => {
        try {
            // First, prep the receipt data
            const allOrders = ordersData?.data || [];
            const relevantOrders = allOrders.filter((o) =>
                orderIds.includes(o.id),
            );

            // Flatten all items from these orders
            const allItems: {
                dishName: string;
                quantity: number;
                price: number;
            }[] = [];
            relevantOrders.forEach((order) => {
                order.items?.forEach((item) => {
                    // Check if item already exists in receipt to merge quantities
                    const existingItem = allItems.find(
                        (i) =>
                            i.dishName === item.dishName &&
                            i.price === Number(item.price),
                    );
                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                    } else {
                        allItems.push({
                            dishName: item.dishName,
                            quantity: item.quantity,
                            price: Number(item.price),
                        });
                    }
                });
            });

            // Mark all orders for this table as COMPLETED sequentially
            for (const orderId of orderIds) {
                await updateStatusMutation.mutateAsync({
                    orderId,
                    status: 'PAID',
                });
            }

            // Set receipt data
            setReceiptData({
                orderIds,
                tableName,
                items: allItems,
                totalAmount,
                cashGiven: parsedCash > 0 ? parsedCash : totalAmount,
                change: parsedCash > 0 ? change : 0,
                paymentMethod: method,
            });

            setIsSuccess(true);

            // Print then close modal
            setTimeout(() => {
                window.print();

                setTimeout(() => {
                    clearCart();
                    utils.order.list.invalidate();
                    utils.table.list.invalidate();
                    onPaymentComplete();
                    onOpenChange(false);
                    setIsSuccess(false);
                    setCashInput('');
                    setReceiptData(null);
                }, 500);
            }, 300);
        } catch (err: any) {
            toast.error(`Thanh toán thất bại: ${err?.message}`);
        }
    };

    const handleAddQuickAmount = (amount: number) => {
        setCashInput(String(parsedCash + amount));
    };

    const handleCashInputChange = (val: string) => {
        const digits = val.replace(/\D/g, '');
        setCashInput(digits);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-r from-emerald-600 to-emerald-500 text-white">
                    <DialogTitle className="text-white text-xl font-bold flex items-center gap-2">
                        💳 Thanh Toán — {tableName}
                    </DialogTitle>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-emerald-100 text-sm">
                            Tổng cộng
                        </span>
                        <span className="text-3xl font-black text-white">
                            {formatVnd(totalAmount)}
                        </span>
                    </div>
                </DialogHeader>

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
                        <CheckCircle2 className="h-20 w-20 text-emerald-500 animate-in zoom-in duration-300" />
                        <p className="text-xl font-bold text-emerald-700">
                            Thanh toán thành công!
                        </p>
                        {method === 'CASH' && change > 0 && (
                            <p className="text-base text-muted-foreground">
                                Tiền thối:{' '}
                                <span className="font-bold text-foreground">
                                    {formatVnd(change)}
                                </span>
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="p-6 space-y-5">
                        {/* Payment Method Selection */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Phương thức thanh toán
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                {methodConfig.map((m) => (
                                    <button
                                        key={m.id}
                                        data-selected={method === m.id}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95',
                                            m.color,
                                        )}
                                        onClick={() => setMethod(m.id)}
                                    >
                                        {m.icon}
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cash Input (only for CASH) */}
                        {method === 'CASH' && (
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Khách đưa
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Nhập số tiền khách đưa..."
                                        value={
                                            parsedCash > 0
                                                ? parsedCash.toLocaleString(
                                                      'vi-VN',
                                                  )
                                                : ''
                                        }
                                        onChange={(e) =>
                                            handleCashInputChange(
                                                e.target.value,
                                            )
                                        }
                                        className="h-14 text-xl font-bold pr-12 text-right border-2 focus-visible:ring-emerald-400"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                        ₫
                                    </span>
                                </div>

                                {/* Quick Amount Buttons */}
                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        Thêm nhanh:
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            onClick={() =>
                                                setCashInput(
                                                    String(totalAmount),
                                                )
                                            }
                                            className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 active:scale-95 transition-all"
                                        >
                                            Vừa đủ
                                        </button>
                                        {QUICK_AMOUNTS.filter((a) => a > 0).map(
                                            (amount) => (
                                                <button
                                                    key={amount}
                                                    onClick={() =>
                                                        handleAddQuickAmount(
                                                            amount,
                                                        )
                                                    }
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-muted text-muted-foreground border hover:bg-muted/80 active:scale-95 transition-all"
                                                >
                                                    +
                                                    {amount >= 1_000_000
                                                        ? `${amount / 1_000_000}M`
                                                        : `${amount / 1_000}k`}
                                                </button>
                                            ),
                                        )}
                                        {parsedCash > 0 && (
                                            <button
                                                onClick={() => setCashInput('')}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-600 border border-rose-200 hover:bg-rose-200 active:scale-95 transition-all"
                                            >
                                                Xóa
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Change calculation */}
                                {parsedCash > 0 && (
                                    <div
                                        className={cn(
                                            'rounded-xl p-3 border-2 text-center transition-colors',
                                            isEnough
                                                ? 'bg-emerald-50 border-emerald-200'
                                                : 'bg-rose-50 border-rose-200',
                                        )}
                                    >
                                        {isEnough ? (
                                            <>
                                                <p className="text-xs text-emerald-600 font-medium">
                                                    Tiền thối lại
                                                </p>
                                                <p className="text-2xl font-black text-emerald-700">
                                                    {formatVnd(change)}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-xs text-rose-600 font-medium">
                                                    Còn thiếu
                                                </p>
                                                <p className="text-2xl font-black text-rose-700">
                                                    {formatVnd(
                                                        Math.abs(change),
                                                    )}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Transfer info */}
                        {method === 'TRANSFER' && (
                            <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4 text-center space-y-2">
                                <QrCode className="h-10 w-10 text-blue-500 mx-auto" />
                                <p className="font-semibold text-blue-700">
                                    Quét mã QR để chuyển khoản
                                </p>
                                <p className="text-sm text-blue-600">
                                    Số tiền: {formatVnd(totalAmount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Xác nhận sau khi đã nhận được tiền chuyển
                                    khoản
                                </p>
                            </div>
                        )}

                        {/* Card info */}
                        {method === 'CARD' && (
                            <div className="rounded-xl bg-violet-50 border-2 border-violet-200 p-4 text-center space-y-2">
                                <CreditCard className="h-10 w-10 text-violet-500 mx-auto" />
                                <p className="font-semibold text-violet-700">
                                    Thanh toán qua máy POS
                                </p>
                                <p className="text-sm text-violet-600">
                                    Số tiền: {formatVnd(totalAmount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Đưa thẻ hoặc quẹt thẻ vào máy POS, sau đó
                                    xác nhận
                                </p>
                            </div>
                        )}

                        {/* Confirm Button */}
                        <Button
                            className="w-full py-6 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg active:scale-[0.98] transition-all"
                            disabled={
                                !isEnough || updateStatusMutation.isPending
                            }
                            onClick={handleConfirmPayment}
                        >
                            {updateStatusMutation.isPending ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 mr-2" />
                            )}
                            Xác nhận thanh toán
                        </Button>
                    </div>
                )}
            </DialogContent>

            {/* Hidden Receipt Component Rendered only on Print */}
            {receiptData && <PrintReceipt {...receiptData} />}
        </Dialog>
    );
}
