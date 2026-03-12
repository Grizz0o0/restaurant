'use client';

import { usePosStore } from '@/store/pos-store';
import { Button } from '@/components/ui/button';
import {
    Minus,
    Plus,
    Trash2,
    MessageSquarePlus,
    ShoppingCart,
    Loader2,
    Pencil,
    ClipboardList,
    PlusCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { ItemNoteDialog } from './item-note-dialog';
import { TableOrderPanel } from './table-order-panel';
import { PaymentModal } from './payment-modal';
import { PrintKitchenSlip, PrintKitchenSlipProps } from './print-kitchen-slip';
import { cn } from '@/lib/utils';

type TabType = 'new-order' | 'table-orders';

export function PosCart() {
    const {
        cartItems,
        selectedTableId,
        selectedTableName,
        updateQuantity,
        updateNote,
        removeFromCart,
        clearCart,
    } = usePosStore();

    const [activeTab, setActiveTab] = useState<TabType>('new-order');
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [noteDialog, setNoteDialog] = useState<{
        open: boolean;
        itemId: string;
        itemName: string;
        currentNote: string;
    } | null>(null);
    const [slipData, setSlipData] = useState<PrintKitchenSlipProps | null>(
        null,
    );

    const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );

    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    const utils = trpc.useUtils();
    const createOrderMutation = trpc.order.create.useMutation({
        onSuccess: (data) => {
            toast.success('Đã gửi order xuống bếp!');

            // Set data for the kitchen slip and trigger print
            setSlipData({
                orderId: data.id,
                tableName: selectedTableName || 'Mang đi',
                items: cartItems.map((item) => ({
                    dishName: item.name,
                    quantity: item.quantity,
                    note: item.note || undefined,
                })),
                time: new Date(),
            });

            // Wait for React to render the slip, then print
            setTimeout(() => {
                window.print();
                clearCart();
            }, 300);

            utils.order.list.invalidate();
            utils.table.list.invalidate();
        },
        onError: (err) => {
            toast.error(`Lỗi tạo đơn: ${err.message}`);
        },
    });

    const handleSendToKitchen = () => {
        if (!selectedTableId) {
            toast.error('Vui lòng chọn bàn trước khi order!');
            return;
        }
        if (cartItems.length === 0) {
            toast.error('Giỏ hàng trống!');
            return;
        }

        createOrderMutation.mutate({
            tableId: selectedTableId,
            items: cartItems.map((item) => ({
                dishId: item.dishId,
                quantity: item.quantity,
                price: Number(item.price),
                note: item.note || undefined,
            })),
        });
    };

    const openNoteDialog = (
        itemId: string,
        itemName: string,
        currentNote = '',
    ) => {
        setNoteDialog({ open: true, itemId, itemName, currentNote });
    };

    // Fetch active orders for selected table (for payment)
    const { data: tableOrdersData } = trpc.order.list.useQuery(
        { page: 1, limit: 50, tableId: selectedTableId! },
        { enabled: !!selectedTableId },
    );

    const activeTableOrders = (tableOrdersData?.data || []).filter((o) =>
        [
            'PENDING_CONFIRMATION',
            'CONFIRMED',
            'PROCESSING',
            'DELIVERED',
        ].includes(o.status),
    );

    const activeTableTotal = activeTableOrders.reduce(
        (sum, o) => sum + o.totalAmount,
        0,
    );

    const activeOrderIds = activeTableOrders.map((o) => o.id);

    return (
        <>
            <div className="flex h-full flex-col w-full bg-background shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-10 print:hidden">
                {/* Header */}
                <div className="p-3 border-b bg-primary/5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="font-semibold text-primary text-base leading-none">
                            {selectedTableName
                                ? `Bàn: ${selectedTableName}`
                                : 'Chưa chọn bàn'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            {cartItems.length > 0
                                ? `${cartItems.reduce((s, i) => s + i.quantity, 0)} món trong giỏ`
                                : 'Chọn bàn và thêm món'}
                        </p>
                    </div>
                    {selectedTableId && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-7 text-xs"
                            onClick={clearCart}
                            disabled={cartItems.length === 0}
                        >
                            Xóa hết
                        </Button>
                    )}
                </div>

                {/* Tabs (shown when table selected) */}
                {selectedTableId && (
                    <div className="flex border-b shrink-0">
                        <button
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors',
                                activeTab === 'new-order'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => setActiveTab('new-order')}
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Đơn Mới
                            {cartItems.length > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0 min-w-4.5 text-center">
                                    {cartItems.length}
                                </span>
                            )}
                        </button>
                        <button
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors',
                                activeTab === 'table-orders'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => setActiveTab('table-orders')}
                        >
                            <ClipboardList className="h-3.5 w-3.5" />
                            Đơn Tại Bàn
                        </button>
                    </div>
                )}

                {/* Tab: Đơn Tại Bàn */}
                {activeTab === 'table-orders' && selectedTableId ? (
                    <div className="flex-1 overflow-y-auto p-3">
                        <TableOrderPanel
                            tableId={selectedTableId}
                            tableName={selectedTableName || ''}
                        />
                    </div>
                ) : (
                    <>
                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto bg-muted/10 p-2 relative">
                            {cartItems.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <ShoppingCart className="h-12 w-12 mb-4" />
                                    <p className="text-sm font-medium">
                                        Chưa có món nào
                                    </p>
                                    <p className="text-xs">
                                        Chọn món từ thực đơn bên trái
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-background border rounded-lg p-3 flex flex-col gap-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
                                        >
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm leading-tight truncate">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-primary font-semibold text-sm mt-1">
                                                        {formatVnd(
                                                            item.price *
                                                                item.quantity,
                                                        )}
                                                    </p>
                                                </div>
                                                {/* Qty Controls */}
                                                <div className="flex items-center bg-muted/50 rounded-md border shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
                                                            if (
                                                                item.quantity >
                                                                1
                                                            )
                                                                updateQuantity(
                                                                    item.id,
                                                                    -1,
                                                                );
                                                            else
                                                                removeFromCart(
                                                                    item.id,
                                                                );
                                                        }}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center text-sm font-bold">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        onClick={() =>
                                                            updateQuantity(
                                                                item.id,
                                                                1,
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Note Display */}
                                            {item.note && (
                                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 italic">
                                                    📝 {item.note}
                                                </p>
                                            )}

                                            {/* Actions Row */}
                                            <div className="flex items-center justify-between border-t border-dashed pt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        'h-7 text-xs px-2 hover:bg-muted',
                                                        item.note
                                                            ? 'text-amber-600 hover:text-amber-700'
                                                            : 'text-muted-foreground',
                                                    )}
                                                    onClick={() =>
                                                        openNoteDialog(
                                                            item.id,
                                                            item.name,
                                                            item.note,
                                                        )
                                                    }
                                                >
                                                    {item.note ? (
                                                        <>
                                                            <Pencil className="h-3 w-3 mr-1" />
                                                            Sửa ghi chú
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageSquarePlus className="h-3 w-3 mr-1" />
                                                            Thêm ghi chú
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() =>
                                                        removeFromCart(item.id)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t bg-background p-4 shrink-0 space-y-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Tạm tính
                                    </span>
                                    <span className="font-medium">
                                        {formatVnd(totalAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Giảm giá
                                    </span>
                                    <span className="font-medium">0 ₫</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                    <span>Tổng cộng</span>
                                    <span className="text-primary text-xl">
                                        {formatVnd(totalAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    className="col-span-2 w-full py-6 text-base font-bold shadow-md active:scale-[0.98] transition-all"
                                    onClick={handleSendToKitchen}
                                    disabled={
                                        cartItems.length === 0 ||
                                        createOrderMutation.isPending
                                    }
                                >
                                    {createOrderMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : null}
                                    GỬI BẾP
                                </Button>
                                <Button
                                    variant="outline"
                                    className="py-5 font-semibold text-muted-foreground active:scale-[0.98]"
                                    disabled
                                >
                                    Tạm Tính
                                </Button>
                                <Button
                                    className="py-5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]"
                                    disabled={
                                        !selectedTableId ||
                                        activeOrderIds.length === 0
                                    }
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    Thanh Toán
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Note Dialog */}
            {noteDialog && (
                <ItemNoteDialog
                    open={noteDialog.open}
                    onOpenChange={(open) =>
                        setNoteDialog((prev) =>
                            prev ? { ...prev, open } : null,
                        )
                    }
                    itemName={noteDialog.itemName}
                    currentNote={noteDialog.currentNote}
                    onSave={(note) => updateNote(noteDialog.itemId, note)}
                />
            )}

            {/* Payment Modal */}
            {selectedTableId && (
                <PaymentModal
                    open={paymentOpen}
                    onOpenChange={setPaymentOpen}
                    orderIds={activeOrderIds}
                    totalAmount={activeTableTotal}
                    tableName={selectedTableName || ''}
                    onPaymentComplete={() => {
                        clearCart();
                        setActiveTab('new-order');
                    }}
                />
            )}

            {/* Hidden Kitchen Slip Rendered on Print */}
            {slipData && <PrintKitchenSlip {...slipData} />}
        </>
    );
}
