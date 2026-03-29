'use client';

import { usePermission } from '@/shared/hooks/use-permission';
import { ReactNode } from 'react';

interface ProtectProps {
    children: ReactNode;
    permission?: string;
    role?: string;
    fallback?: ReactNode;
}

export const Protect = ({
    children,
    permission,
    role,
    fallback = null,
}: ProtectProps) => {
    const { hasPermission, hasRole } = usePermission();

    if (role && !hasRole(role)) {
        return <>{fallback}</>;
    }

    if (permission && !hasPermission(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
