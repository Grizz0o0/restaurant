'use client';

import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface PrintKitchenSlipProps {
    orderId: string;
    tableName: string;
    items: {
        dishName: string;
        quantity: number;
        note?: string | null;
    }[];
    time?: Date;
}

/**
 * A hidden component that only appears when window.print() is called.
 * It is formatted specifically for 80mm thermal printers (K80).
 */
export function PrintKitchenSlip({
    orderId,
    tableName,
    items,
    time = new Date(),
}: PrintKitchenSlipProps) {
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

            <div className="text-center pb-3 mb-3 border-b-2 border-dashed border-black">
                <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
                    BÁO BẾP
                </h1>
                <p className="text-sm font-medium">
                    {format(time, 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
            </div>

            <div className="flex justify-between items-end mb-4 font-bold">
                <div className="text-left">
                    <p className="text-xs uppercase text-gray-600 mb-0.5">
                        Bàn / Box
                    </p>
                    <p className="text-2xl leading-none">{tableName}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase text-gray-600 mb-0.5">
                        Mã Order
                    </p>
                    <p className="text-xl leading-none">
                        #{orderId.slice(-6).toUpperCase()}
                    </p>
                </div>
            </div>

            <table className="w-full text-left mb-6 border-collapse">
                <thead>
                    <tr className="border-b-2 border-black text-sm">
                        <th className="py-1.5 w-10 text-center">SL</th>
                        <th className="py-1.5 pl-2">Tên món</th>
                    </tr>
                </thead>
                <tbody className="divide-y border-b-2 border-black">
                    {items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-3 text-2xl font-black text-center align-top border-r">
                                {item.quantity}
                            </td>
                            <td className="py-3 pl-2 align-top">
                                <span className="font-bold text-lg leading-tight block">
                                    {item.dishName}
                                </span>
                                {item.note && (
                                    <span className="inline-block mt-1 text-sm font-medium italic border border-black/30 px-1 py-0.5 rounded">
                                        ➤ Ghi chú: {item.note}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="text-center font-medium text-xs text-gray-600">
                --- Hết ---
            </div>
        </div>
    );
}
