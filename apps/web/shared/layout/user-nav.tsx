'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermission } from '@/shared/hooks/use-permission';
import { LayoutDashboard, LogOut, Store, User } from 'lucide-react';
import Link from 'next/link';

export function UserNav() {
    const { user, logout } = useAuth();
    const { hasRole } = usePermission();

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage
                            src={user?.avatar || ''}
                            alt={user?.name || 'User'}
                        />
                        <AvatarFallback>
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
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
                    <Link href="/profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Hồ sơ</span>
                        </DropdownMenuItem>
                    </Link>
                    {(hasRole('ADMIN') || hasRole('MANAGER')) && (
                        <Link href="/admin/dashboard">
                            <DropdownMenuItem>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Quản lý</span>
                            </DropdownMenuItem>
                        </Link>
                    )}
                    {(hasRole('ADMIN') ||
                        hasRole('MANAGER') ||
                        hasRole('STAFF')) && (
                        <Link href="/staff">
                            <DropdownMenuItem>
                                <Store className="mr-2 h-4 w-4" />
                                <span>POS</span>
                            </DropdownMenuItem>
                        </Link>
                    )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                    {/* <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut> */}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
