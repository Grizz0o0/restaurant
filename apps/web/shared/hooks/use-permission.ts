import { useAuth } from '@/features/auth/hooks/use-auth';
import { useMemo } from 'react';

export const usePermission = () => {
    const { user } = useAuth();

    const permissions = useMemo(() => {
        return user?.role?.permissions || [];
    }, [user]);

    const hasPermission = (permissionPath: string) => {
        if (!user || !user.role) return false;

        if (user.role.name === 'ADMIN') return true;

        return permissions.some((p: { path: string }) => {

            if (p.path === permissionPath) return true;

            if (p.path.endsWith('.*')) {
                const prefix = p.path.replace('.*', '');
                return permissionPath.startsWith(prefix);
            }
            return false;
        });
    };

    const hasRole = (roleName: string) => {
        return user?.role?.name === roleName;
    };

    return {
        permissions,
        hasPermission,
        hasRole,
        role: user?.role,
    };
};
