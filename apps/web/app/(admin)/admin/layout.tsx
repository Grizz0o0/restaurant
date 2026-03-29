'use client';

import { RouteGuard } from '@/shared/providers/route-guard';
import { usePermission } from '@/shared/hooks/use-permission';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { AdminHeader } from '@/features/admin/components/admin-header';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <AdminRoleCheck>{children}</AdminRoleCheck>
        </RouteGuard>
    );
}

const AdminRoleCheck = ({ children }: { children: React.ReactNode }) => {
    const { hasRole, permissions } = usePermission();
    const router = useRouter();

    const canAccess = hasRole('ADMIN') || hasRole('MANAGER');

    useEffect(() => {
        if (!canAccess) {
            // router.push('/');
        }
    }, [canAccess, router]);

    if (!canAccess) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-destructive">
                    Truy cập bị từ chối
                </h1>
                <p>Bạn không có quyền truy cập vào khu vực quản trị.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <div className="md:pl-64 flex flex-col min-h-screen">
                <AdminHeader />
                <main className="flex-1 transition-all duration-300 ease-in-out p-2 md:p-4 pt-2">
                    {children}
                </main>
            </div>
        </div>
    );
};
