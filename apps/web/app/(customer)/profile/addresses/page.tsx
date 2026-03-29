'use client';

import { AddressList } from '@/features/profile/components/address-list';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

export default function AddressesPage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center">Đang tải...</div>;
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
                <p className="text-muted-foreground mb-8">
                    Vui lòng đăng nhập để xem sổ địa chỉ
                </p>
                <Button onClick={() => (window.location.href = '/auth/login')}>
                    Đăng nhập ngay
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Sổ địa chỉ</h3>
                <p className="text-sm text-muted-foreground">
                    Quản lý danh sách địa chỉ giao hàng của bạn.
                </p>
            </div>
            <Separator />
            <AddressList />
        </div>
    );
}
