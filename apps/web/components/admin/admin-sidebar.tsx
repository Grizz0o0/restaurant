'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    UtensilsCrossed,
    QrCode,
    LogOut,
    FolderTree,
    Truck,
    ShoppingCart,
    Users,
    Grid,
    Ticket,
    Package,
    Settings,
    CalendarDays,
    MessageSquareText,
    BarChart3,
    Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/domain/use-auth';

const sidebarItems = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Món ăn',
        href: '/admin/dishes',
        icon: UtensilsCrossed,
    },
    {
        title: 'Danh mục',
        href: '/admin/categories',
        icon: FolderTree,
    },
    {
        title: 'Bàn ăn',
        href: '/admin/tables',
        icon: Grid,
    },
    {
        title: 'Đặt bàn',
        href: '/admin/reservations',
        icon: CalendarDays,
    },
    {
        title: 'Đơn hàng',
        href: '/admin/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Khuyến mãi',
        href: '/admin/promotions',
        icon: Ticket,
    },
    {
        title: 'Kho hàng',
        href: '/admin/inventory',
        icon: Package,
    },
    {
        title: 'Nhà cung cấp',
        href: '/admin/suppliers',
        icon: Truck,
    },
    {
        title: 'Người dùng',
        href: '/admin/users',
        icon: Users,
    },
    {
        title: 'Table QR',
        href: '/admin/table-qr',
        icon: QrCode,
    },
    {
        title: 'Cài đặt',
        href: '/admin/settings',
        icon: Settings,
    },
    {
        title: 'Chat Hỗ trợ',
        href: '/admin/chat',
        icon: MessageSquareText,
    },
    {
        title: 'Báo cáo',
        href: '/admin/reports',
        icon: BarChart3,
    },
    {
        title: 'Đánh giá',
        href: '/admin/reviews',
        icon: Star,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="hidden w-64 flex-col border-r bg-background md:flex inset-y-0 fixed left-0 top-0 z-30 h-full">
            <div className="flex h-16 items-center border-b px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-display text-xl font-bold"
                >
                    <span className="text-primary">Admin</span>Portal
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <nav className="flex flex-col gap-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                                pathname.startsWith(item.href)
                                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="border-t p-4">
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                </Button>
            </div>
        </aside>
    );
}
