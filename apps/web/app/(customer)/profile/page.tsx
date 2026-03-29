'use client';

import { ProfileForm } from '@/features/profile/components/profile-form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

export default function ProfilePage() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div className="p-8 text-center">Đang tải...</div>;
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
                <p className="text-muted-foreground mb-8">
                    Vui lòng đăng nhập để xem hồ sơ
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
                <h3 className="text-lg font-medium">Thông tin tài khoản</h3>
                <p className="text-sm text-muted-foreground">
                    Cập nhật thông tin cá nhân của bạn.
                </p>
            </div>
            <Separator />
            <ProfileForm />
        </div>
    );
}
