'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermission } from '@/shared/hooks/use-permission';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface RouteGuardProps {
    children: React.ReactNode;
    permission?: string;
    role?: string;
}

export const RouteGuard = ({ children, permission, role }: RouteGuardProps) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { hasPermission, hasRole } = usePermission();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            toast.error('Vui lòng đăng nhập để tiếp tục');
            router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (role && !hasRole(role)) {
            toast.error('Bạn không có quyền truy cập trang này');
            router.push('/');
            return;
        }

        if (permission && !hasPermission(permission)) {
            toast.error('Bạn không có quyền truy cập chức năng này');
            router.push('/');
            return;
        }
    }, [
        isAuthenticated,
        isLoading,
        role,
        permission,
        hasRole,
        hasPermission,
        router,
        pathname,
    ]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) return null;
    if (role && !hasRole(role)) return null;
    if (permission && !hasPermission(permission)) return null;

    return <>{children}</>;
};
