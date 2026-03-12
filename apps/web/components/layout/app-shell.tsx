'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { CartDrawer } from '@/components/cart/cart-drawer';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');
    const isStaff = pathname?.startsWith('/staff');

    if (isAdmin || isStaff) {
        return (
            <>
                {children}
                <Sonner />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-20">{children}</main>
            <Footer />
            <Sonner />
            <CartDrawer />
        </>
    );
}
