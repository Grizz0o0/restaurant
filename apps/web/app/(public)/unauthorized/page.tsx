'use client';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function UnauthorizedPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect');

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center space-y-4 pb-4">
                    <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <ShieldAlert className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Unauthorized Access
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-gray-600 dark:text-gray-300">
                            Bạn cần đăng nhập để truy cập trang này.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Vui lòng đăng nhập với tài khoản của bạn để tiếp
                            tục.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href={`/auth/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                            className="w-full"
                        >
                            <Button className="w-full" size="lg">
                                <LogIn className="w-4 h-4 mr-2" />
                                Đăng nhập
                            </Button>
                        </Link>

                        <Link href="/" className="w-full">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Về trang chủ
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
