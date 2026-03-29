'use client';

import { NotificationBell } from '@/shared/layout/notification-bell';
import { useAuth } from '@/features/auth/hooks/use-auth';
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
import {
    LogOut,
    Settings as SettingsIcon,
    Menu as MenuIcon,
    Store,
    User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/shared/ui/sheet';
import { AdminSidebarContent } from './admin-sidebar';
import { Button } from '@/shared/ui/button';

export function AdminHeader() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-4">
                <Sheet
                    open={isMobileMenuOpen}
                    onOpenChange={setIsMobileMenuOpen}
                >
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                        >
                            <MenuIcon className="h-5 w-5" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <SheetTitle className="sr-only">
                            Menu Quản trị
                        </SheetTitle>
                        <AdminSidebarContent
                            onItemClick={() => setIsMobileMenuOpen(false)}
                        />
                    </SheetContent>
                </Sheet>
                <h2 className="text-lg font-semibold tracking-tight hidden md:block">
                    Quản trị
                </h2>
                <h2 className="text-lg font-semibold tracking-tight md:hidden">
                    BAMIXO
                </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
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
                                    href="/profile"
                                    className="cursor-pointer"
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Hồ sơ</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/admin/settings"
                                    className="cursor-pointer"
                                >
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    <span>Cài đặt hệ thống</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/staff" className="cursor-pointer">
                                    <Store className="mr-2 h-4 w-4" />
                                    <span>POS</span>
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
