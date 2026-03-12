'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface PrintReceiptProps {
    orderIds: string[];
    tableName: string;
    items: {
        dishName: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    cashGiven?: number;
    change?: number;
    paymentMethod: string;
    time?: Date;
}

/**
 * A hidden component that only appears when window.print() is called.
 * It is formatted specifically for 80mm thermal printers (K80).
 */
export function PrintReceipt({
    orderIds,
    tableName,
    items,
    totalAmount,
    cashGiven,
    change,
    paymentMethod,
    time = new Date(),
}: PrintReceiptProps) {
    const formatVnd = (amount: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);

    return (
        <div className="hidden print:block text-black bg-white w-[78mm] mx-auto py-2 font-mono">
            {/* 
                CSS specific for K80 printing 
                - Removes margins
                - Hides everything else on the page (handled in layout)
            */}
            <style type="text/css" media="print">
                {`
                    @page { size: 80mm auto; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: transparent !important; }
                `}
            </style>

            {/* Header: Store Info */}
            <div className="text-center pb-3 mb-2 border-b border-black border-dashed">
                <h1 className="text-2xl font-black uppercase mb-1">BAMIXO</h1>
                <p className="text-xs font-medium uppercase tracking-widest text-gray-700">
                    Bánh Mì & Thuần Xôi
                </p>
                <p className="text-xs text-gray-800 mt-1">
                    ĐC: Kiến Hưng, Hà Đông, HN
                </p>
                <p className="text-xs text-gray-800">SĐT: 0363 290 475</p>
            </div>

            <div className="text-center pb-3 mb-3 border-b border-black">
                <h2 className="text-lg font-bold uppercase tracking-widest mb-1">
                    HÓA ĐƠN THANH TOÁN
                </h2>
                <div className="flex justify-between text-xs font-medium">
                    <span>In lúc: {format(time, 'dd/MM/yyyy HH:mm')}</span>
                </div>
            </div>

            {/* Order Info */}
            <div className="flex justify-between items-end mb-4 font-bold border-b border-black pb-2">
                <div className="text-left">
                    <p className="text-xs uppercase text-gray-600 mb-0.5">
                        Bàn / Box
                    </p>
                    <p className="text-xl leading-none">{tableName}</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-xs uppercase text-gray-600 mb-0.5">
                        Số đơn
                    </p>
                    {orderIds.map((id) => (
                        <p
                            key={id}
                            className="text-sm font-medium font-mono leading-tight"
                        >
                            #{id.slice(-6).toUpperCase()}
                        </p>
                    ))}
                </div>
            </div>

            {/* Items */}
            <table className="w-full text-left mb-4 border-collapse">
                <thead>
                    <tr className="border-b border-black border-dashed text-xs">
                        <th className="py-1">Món</th>
                        <th className="py-1 text-center w-8">SL</th>
                        <th className="py-1 text-right w-20">T.Tiền</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {items.map((item, idx) => (
                        <tr
                            key={idx}
                            className="border-b border-gray-300 border-dashed"
                        >
                            <td className="py-2 pr-1 font-semibold leading-tight">
                                {item.dishName}
                                <div className="text-xs text-gray-600 font-normal">
                                    {formatVnd(item.price)}
                                </div>
                            </td>
                            <td className="py-2 text-center font-bold align-top">
                                {item.quantity}
                            </td>
                            <td className="py-2 text-right font-medium align-top">
                                {formatVnd(item.price * item.quantity)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="space-y-1 text-sm border-b border-black pb-3 mb-3">
                <div className="flex justify-between">
                    <span>Cộng tiền hàng:</span>
                    <span>{formatVnd(totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Giảm giá:</span>
                    <span>0 ₫</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1 mt-1 border-t border-black border-dashed">
                    <span className="uppercase">Tổng cộng:</span>
                    <span>{formatVnd(totalAmount)}</span>
                </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 text-sm pb-4 mb-4 border-b border-black border-dashed">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Phương thức:</span>
                    <span className="font-semibold uppercase text-black">
                        {paymentMethod === 'CASH'
                            ? 'Tiền mặt'
                            : paymentMethod === 'TRANSFER'
                              ? 'Chuyển khoản'
                              : 'Thẻ / POS'}
                    </span>
                </div>

                {paymentMethod === 'CASH' && (
                    <>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>Khách đưa:</span>
                            <span className="font-semibold text-black">
                                {formatVnd(cashGiven || totalAmount)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                            <span>Thối lại:</span>
                            <span className="font-semibold text-black">
                                {formatVnd(change || 0)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="text-center space-y-1">
                <p className="font-bold text-sm italic">Cảm ơn quý khách!</p>
                <p className="font-bold text-sm italic">Hẹn gặp lại</p>
                <p className="text-xs text-gray-500 mt-4">
                    Powered by BAMIXO POS
                </p>
                <div className="pb-4">--- Hết ---</div>
            </div>
        </div>
    );
}
