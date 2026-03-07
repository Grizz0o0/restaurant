'use client';

import { NotificationBell } from '@/components/layout/notification-bell';
import { useAuth } from '@/hooks/domain/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

export function AdminHeader() {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold tracking-tight hidden md:block">
                    Quản trị
                </h2>
            </div>
            <div className="flex items-center gap-4">
                <NotificationBell />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 border-l pl-4 cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors select-none">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium leading-none">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 capitalize">
                                    {user?.role?.name?.toLowerCase() || 'Admin'}
                                </p>
                            </div>
                            <Avatar className="h-8 w-8 transition-transform hover:scale-105 border">
                                <AvatarImage src={user?.avatar || undefined} />
                                <AvatarFallback>
                                    {user?.name?.charAt(0).toUpperCase() || 'A'}
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
                                    href="/admin/settings"
                                    className="cursor-pointer"
                                >
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    <span>Cài đặt hệ thống</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
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
