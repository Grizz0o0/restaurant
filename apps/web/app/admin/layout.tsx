'use client';

import { RouteGuard } from '@/components/auth/route-guard';
import { usePermission } from '@/hooks/use-permission';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

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

    // Simple check: Must be ADMIN or MANAGER
    // In a real app we might check for a specific permission like 'view:dashboard'
    const canAccess = hasRole('ADMIN') || hasRole('MANAGER');

    useEffect(() => {
        if (!canAccess) {
            // Redirect or show 403
            // For now redirect home
            // router.push('/');
            // Commented out to avoid loop if hook is slow, but visual protection below handles it.
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
