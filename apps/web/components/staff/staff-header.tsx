'use client';

import { useAuth } from '@/hooks/domain/use-auth';
import { usePermission } from '@/hooks/use-permission';
import { LogOut, Wifi, WifiOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { KitchenQueueDrawer } from './pos/kitchen-queue-drawer';

export function StaffHeader() {
    const { user, logout } = useAuth();
    const { role, hasRole } = usePermission();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Update time every minute
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        // Check online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            clearInterval(timer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const roleNameDisplay = hasRole('ADMIN')
        ? 'Quản trị viên'
        : hasRole('MANAGER')
          ? 'Quản lý'
          : 'Nhân viên';

    return (
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
                <div className="font-display text-xl font-bold text-primary">
                    POS System
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                        {format(currentTime, 'EEEE, dd/MM/yyyy HH:mm', {
                            locale: vi,
                        })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Kitchen Queue Drawer */}
                <KitchenQueueDrawer />

                {/* Connection Status */}
                <div
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                        isOnline
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                    }`}
                >
                    {isOnline ? (
                        <>
                            <Wifi className="h-3.5 w-3.5" />
                            Đang kết nối
                        </>
                    ) : (
                        <>
                            <WifiOff className="h-3.5 w-3.5" />
                            Mất mạng
                        </>
                    )}
                </div>

                <div className="h-4 w-px bg-border" />

                {/* User Info */}
                <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold leading-none">
                        {user?.name || 'Loading...'}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                        {roleNameDisplay}
                    </span>
                </div>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                    title="Đăng xuất"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </header>
    );
}
