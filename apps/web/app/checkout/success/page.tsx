'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md text-center border-none shadow-none bg-transparent">
                <CardContent className="space-y-6 pt-6">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-green-100 p-4 ring-8 ring-green-50">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold font-display text-green-700">
                            Đặt hàng thành công!
                        </h1>
                        <p className="text-muted-foreground">
                            Cảm ơn bạn đã đặt hàng tại BAMIXO. <br />
                            Đơn hàng của bạn đang được chúng tôi xử lý.
                        </p>
                    </div>

                    {orderId && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                            <p className="text-sm text-muted-foreground">
                                Mã đơn hàng
                            </p>
                            <p className="text-lg font-mono font-bold tracking-wider">
                                {orderId.slice(-8).toUpperCase()}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                        <Link href="/profile/order">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                            >
                                Xem đơn hàng
                            </Button>
                        </Link>
                        <Link href="/menu">
                            <Button className="w-full sm:w-auto">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Tiếp tục mua sắm
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
