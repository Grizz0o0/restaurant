'use client';

import { PosTableMap } from '@/components/staff/pos/pos-table-map';
import { PosMenu } from '@/components/staff/pos/pos-menu';
import { PosCart } from '@/components/staff/pos/pos-cart';

export default function StaffPosPage() {
    return (
        <div className="flex h-full w-full overflow-hidden bg-background print:block print:h-auto">
            {/* Column 1: Table Area (25%) */}
            <div className="w-75 shrink-0 h-full border-r border-border/50 z-20 print:hidden">
                <PosTableMap />
            </div>

            {/* Column 2: Menu Area (50%) */}
            <div className="flex-1 h-full min-w-100 print:hidden">
                <PosMenu />
            </div>

            {/* Column 3: Current Ticket/Cart Area (25%) */}
            <div className="w-95 shrink-0 h-full border-l border-border/50 z-30 shadow-2xl print:w-full print:border-none print:shadow-none print:h-auto">
                <PosCart />
            </div>
        </div>
    );
}
