'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, Home, Mail } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/domain/use-auth';

export default function ForbiddenPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center space-y-4 pb-4">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <ShieldX className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Access Denied
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-gray-600 dark:text-gray-300">
                            Bạn không có quyền truy cập trang này.
                        </p>
                        {user ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Tài khoản của bạn (<strong>{user.email}</strong>
                                ) không có quyền truy cập vào khu vực này.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Vui lòng liên hệ quản trị viên nếu bạn nghĩ đây
                                là lỗi.
                            </p>
                        )}
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Lưu ý:</strong> Khu vực này chỉ dành cho
                            quản trị viên (Admin/Manager).
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link href="/" className="w-full">
                            <Button className="w-full" size="lg">
                                <Home className="w-4 h-4 mr-2" />
                                Về trang chủ
                            </Button>
                        </Link>

                        <Link href="/contact" className="w-full">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Liên hệ hỗ trợ
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
