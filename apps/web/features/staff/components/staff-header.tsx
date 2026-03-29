'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermission } from '@/shared/hooks/use-permission';
import {
    LogOut,
    Wifi,
    WifiOff,
    Clock,
    User as UserIcon,
    Settings as SettingsIcon,
    Store,
    LayoutDashboard,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Button } from '@/shared/ui/button';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { KitchenQueueDrawer } from './pos/kitchen-queue-drawer';
import Link from 'next/link';

export function StaffHeader() {
    const { user, logout } = useAuth();
    const { role, hasRole } = usePermission();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);


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
                <Link
                    href="/"
                    className="font-display text-xl font-bold text-primary hover:opacity-80 transition-opacity"
                >
                    POS System
                </Link>
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

                <KitchenQueueDrawer />


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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors select-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none">
                                    {user?.name || 'Loading...'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {roleNameDisplay}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 transition-transform hover:scale-105 border">
                                <AvatarImage src={user?.avatar || undefined} />
                                <AvatarFallback>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56"
                        align="end"
                        forceMount
                    >
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {user?.name}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/profile"
                                    className="cursor-pointer text-foreground flex items-center"
                                >
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ</span>
                                </Link>
                            </DropdownMenuItem>
                            {hasRole('ADMIN') && (
                                <DropdownMenuItem asChild>
                                    <Link
                                        href="/admin"
                                        className="cursor-pointer text-foreground flex items-center"
                                    >
                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                        <span>Quản trị</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href="/staff" className="cursor-pointer">
                                    <Store className="mr-2 h-4 w-4" />
                                    <span>POS</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer flex items-center"
                            onClick={() => logout()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
