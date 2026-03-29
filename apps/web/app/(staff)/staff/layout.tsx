'use client';

import { RouteGuard } from '@/shared/providers/route-guard';
import { usePermission } from '@/shared/hooks/use-permission';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StaffHeader } from '@/features/staff/components/staff-header';

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <RouteGuard>
            <StaffRoleCheck>{children}</StaffRoleCheck>
        </RouteGuard>
    );
}

const StaffRoleCheck = ({ children }: { children: React.ReactNode }) => {
    const { hasRole } = usePermission();
    const router = useRouter();

    // Staff interface is accessible by STAFF, MANAGER, and ADMIN
    const canAccess =
        hasRole('STAFF') || hasRole('MANAGER') || hasRole('ADMIN');

    useEffect(() => {
        if (!canAccess) {
            // Option to redirect or just rely on the UI to show access denied
            // router.push('/');
        }
    }, [canAccess, router]);

    if (!canAccess) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
                <h1 className="text-2xl font-bold text-destructive">
                    Truy cập bị từ chối
                </h1>
                <p>Bạn không có quyền truy cập vào giao diện bán hàng (POS).</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col bg-muted/30 overflow-hidden print:bg-white print:h-auto print:overflow-visible">
            <div className="print:hidden">
                <StaffHeader />
            </div>
            <main className="flex-1 overflow-hidden print:overflow-visible">
                {children}
            </main>
        </div>
    );
};
