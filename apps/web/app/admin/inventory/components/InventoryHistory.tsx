'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, History, ArrowUpRight, ArrowDownRight, RefreshCcw, Trash2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const REASON_MAP: Record<string, { label: string; color: string; icon: any }> = {
    RESTOCK: { label: 'Nhập kho', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: ArrowUpRight },
    ORDER: { label: 'Xuất kho (Đơn hàng)', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: ArrowDownRight },
    ADJUST: { label: 'Điều chỉnh', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: Settings2 },
    WASTE: { label: 'Hủy bỏ/Hao hụt', color: 'text-rose-600 bg-rose-50 border-rose-200', icon: Trash2 },
};

export function InventoryHistory() {
    const [page, setPage] = useState(1);
    const { data, isLoading } = trpc.inventory.listTransactions.useQuery({
        page,
        limit: 20,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const transactions = data?.data || [];

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Lịch sử biến động kho</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-xl border bg-card overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="font-semibold">Thời gian</TableHead>
                                <TableHead className="font-semibold">Mặt hàng</TableHead>
                                <TableHead className="font-semibold text-right">Thay đổi</TableHead>
                                <TableHead className="font-semibold">Lý do</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                        Chưa có lịch sử biến động nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: any) => {
                                    const reason = REASON_MAP[tx.reason] || { label: tx.reason, color: '', icon: RefreshCcw };
                                    const Icon = reason.icon;
                                    const isPositive = Number(tx.changeQuantity) > 0;

                                    return (
                                        <TableRow key={tx.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {format(new Date(tx.timestamp), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {tx.inventory?.itemName}
                                                <span className="ml-1 text-xs text-muted-foreground font-normal">
                                                    ({tx.inventory?.unit})
                                                </span>
                                            </TableCell>
                                            <TableCell className={cn(
                                                "text-right font-bold tabular-nums",
                                                isPositive ? "text-emerald-600" : "text-rose-600"
                                            )}>
                                                {isPositive ? '+' : ''}{tx.changeQuantity}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("gap-1.5 py-1 px-2.5 font-medium border shadow-xs transition-none", reason.color)}>
                                                    <Icon className="h-3.5 w-3.5" />
                                                    {reason.label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
