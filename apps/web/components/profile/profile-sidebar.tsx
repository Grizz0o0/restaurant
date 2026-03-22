'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Shield, Package, MapPin, LogOut, Star } from 'lucide-react';
import { useAuth } from '@/hooks/domain/use-auth';

const sidebarNavItems = [
    {
        title: 'Hồ sơ',
        href: '/profile',
        icon: User,
    },
    {
        title: 'Bảo mật',
        href: '/profile/security',
        icon: Shield,
    },
    {
        title: 'Đơn hàng',
        href: '/profile/orders',
        icon: Package,
    },
    {
        title: 'Đánh giá của tôi',
        href: '/profile/reviews',
        icon: Star,
    },
    {
        title: 'Sổ địa chỉ',
        href: '/profile/addresses',
        icon: MapPin,
    },
];

export function ProfileSidebar({
    className,
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    const pathname = usePathname();
    const { logout } = useAuth();
    const router = useRouter();

    return (
        <nav
            className={cn(
                'flex overflow-x-auto pb-4 mb-2 lg:mb-0 lg:pb-0 lg:flex-col lg:space-x-0 lg:space-y-1 no-scrollbar',
                className,
            )}
            {...props}
        >
            <div className="flex lg:flex-col gap-2 w-max lg:w-full">
                {sidebarNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'flex items-center gap-2 lg:gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-all shrink-0 whitespace-nowrap',
                            pathname === item.href
                                ? 'bg-accent text-accent-foreground shadow-sm'
                                : 'text-muted-foreground',
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
                <div className="lg:pt-4 lg:mt-4 lg:border-t flex lg:block">
                    <button
                        onClick={() => {
                            logout();
                            router.push('/auth/login');
                        }}
                        className={cn(
                            'flex shrink-0 whitespace-nowrap items-center gap-2 lg:gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all',
                        )}
                    >
                        <LogOut className="h-4 w-4" />
                        <span className="lg:inline">Đăng xuất</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
