'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { type inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@repo/trpc';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Table = RouterOutputs['table']['list']['data'][number];

export default function TableQRPage() {
    const [page, setPage] = useState(1);
    const { data: tablesData, isLoading } = trpc.table.list.useQuery({
        page,
        limit: 100,
    });

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Table QR Codes</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tablesData?.data.map((table: Table) => (
                    <Card key={table.id} className="print:break-inside-avoid">
                        <CardHeader>
                            <CardTitle className="text-center">
                                Table {table.tableNumber}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-4">
                            <div className="bg-white p-4 rounded-lg shadow-sm border">
                                <QRCodeSVG
                                    value={table.qrCodeUrl || table.id}
                                    size={200}
                                />
                            </div>
                            <p className="text-sm text-gray-500 break-all text-center">
                                {table.qrCodeUrl}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                            >
                                Print QR
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
