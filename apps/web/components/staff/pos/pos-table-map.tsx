'use client';

import { usePosStore } from '@/store/pos-store';
import { trpc } from '@/lib/trpc/client';
import { Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function PosTableMap() {
    const { selectedTableId, setSelectedTable } = usePosStore();

    const { data: tablesData, isLoading } = trpc.table.list.useQuery({
        page: 1,
        limit: 100,
    });

    const tables = tablesData?.data || [];

    // Filter statuses
    const emptyTables = tables.filter((t) => t.status === 'AVAILABLE');
    const occupiedTables = tables.filter((t) => t.status === 'OCCUPIED');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-background border-r">
            {/* Header */}
            <div className="p-4 border-b shrink-0 bg-background/95 backdrop-blur z-10">
                <h2 className="font-semibold text-lg flex justify-between items-center">
                    Khu vực bàn
                    <Badge
                        variant="outline"
                        className="font-normal text-xs bg-muted/50"
                    >
                        {emptyTables.length}/{tables.length} Trống
                    </Badge>
                </h2>
                <div className="flex gap-3 mt-3 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        Trống
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        Đang phục vụ
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 bg-muted/20">
                <div className="grid grid-cols-2 gap-3">
                    {tables.map((table) => {
                        const isSelected = selectedTableId === table.id;
                        const isOccupied = table.status === 'OCCUPIED';

                        return (
                            <button
                                key={table.id}
                                onClick={() =>
                                    setSelectedTable(
                                        table.id,
                                        table.tableNumber,
                                    )
                                }
                                className={cn(
                                    'relative p-3 rounded-xl border-2 text-left transition-all duration-200 aspect-4/3 flex flex-col justify-between group active:scale-95',
                                    isSelected
                                        ? 'border-primary shadow-md bg-primary/5'
                                        : 'border-transparent bg-background shadow-sm hover:border-primary/30',
                                )}
                            >
                                {/* Top indicators: capacity and status dot */}
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted/50">
                                        <Users className="w-3 h-3" />
                                        {table.capacity}
                                    </div>
                                    <div
                                        className={cn(
                                            'w-2.5 h-2.5 rounded-full shadow-sm',
                                            isOccupied
                                                ? 'bg-amber-500 shadow-amber-500/30'
                                                : 'bg-emerald-500 shadow-emerald-500/30',
                                        )}
                                    ></div>
                                </div>

                                {/* Table Name centered */}
                                <div className="text-center w-full">
                                    <p className="font-bold text-lg text-foreground truncate">
                                        {table.tableNumber}
                                    </p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-medium mt-0.5 truncate">
                                        {isOccupied ? 'Có khách' : 'Bàn trống'}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
