'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { CartButton } from '@/features/cart/components/cart-button';
import { ModeToggle } from '@/shared/ui/mode-toggle';
import { cn } from '@/lib/utils';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { usePermission } from '@/shared/hooks/use-permission';
import { UserNav } from './user-nav';
import { NotificationBell } from './notification-bell';

const Header = () => {
    const { isAuthenticated, user, logout, isLoading } = useAuth();
    const { hasRole } = usePermission();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    // Handle initial mount
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Trang chủ', href: '/' },
        { name: 'Thực đơn', href: '/menu' },
        { name: 'Đánh giá', href: '/reviews' },
        { name: 'Về chúng tôi', href: '/about' },
        { name: 'Liên hệ', href: '/contact' },
    ];

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname?.startsWith(href);
    };

    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b border-transparent',
                scrolled
                    ? 'bg-background/80 backdrop-blur-md shadow-sm py-2 border-border/40'
                    : 'bg-transparent py-4',
            )}
        >
            <div className="container mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-12 h-12 group-hover:scale-105 transition-transform duration-200 rounded-full">
                            <Image
                                src="/images/logo-trans.png"
                                alt="BAMIXO Logo"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-display font-bold text-2xl leading-tight text-foreground tracking-tight">
                                BAMIXO
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                                Bánh Mì & Xôi
                            </span>
                        </div>
                    </Link>
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(
                                    'text-sm font-medium transition-colors hover:text-primary relative py-1',
                                    isActive(link.href)
                                        ? 'text-foreground font-semibold'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {link.name}
                                {isActive(link.href) && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-in zoom-in-50 duration-300" />
                                )}
                            </Link>
                        ))}
                    </nav>
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1">
                            <ModeToggle />
                            <NotificationBell />
                        </div>
                        <div className="hidden sm:block">
                            <CartButton />
                        </div>
                        <Link href="/menu">
                            <Button
                                size="sm"
                                className="rounded-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all px-4 sm:px-6"
                            >
                                <span className="hidden xs:inline">
                                    Đặt hàng ngay
                                </span>
                                <span className="xs:hidden font-semibold">
                                    Đặt món
                                </span>
                            </Button>
                        </Link>
                        <div className="hidden sm:block">
                            {!isMounted || isLoading ? (
                                <div className="h-9 w-20 bg-muted/50 animate-pulse rounded-md" />
                            ) : isAuthenticated ? (
                                <UserNav />
                            ) : (
                                <Link href="/auth/login">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                    >
                                        Đăng nhập
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-secondary transition-colors text-foreground"
                        >
                            {isMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 px-2 border-t border-border/50 animate-in slide-in-from-top-2 bg-background/95 backdrop-blur-md absolute top-full left-0 right-0 shadow-lg border-b">
                        <nav className="flex flex-col gap-2 container mx-auto">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={cn(
                                        'px-4 py-3 text-sm font-medium rounded-xl transition-all',
                                        isActive(link.href)
                                            ? 'bg-secondary text-primary'
                                            : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-border/50 my-2" />
                            <div className="flex flex-col gap-2 px-2">
                                {!isMounted || isLoading ? (
                                    <div className="h-10 w-full bg-muted/50 animate-pulse rounded-xl" />
                                ) : isAuthenticated ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="px-4 py-2 text-sm font-medium text-foreground">
                                            Chào, {user?.name}
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start rounded-xl"
                                            >
                                                <User className="mr-2 h-4 w-4" />
                                                Hồ sơ cá nhân
                                            </Button>
                                        </Link>
                                        {(hasRole('ADMIN') ||
                                            hasRole('MANAGER')) && (
                                            <Link
                                                href="/admin/dashboard"
                                                onClick={() =>
                                                    setIsMenuOpen(false)
                                                }
                                            >
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start rounded-xl mb-2"
                                                >
                                                    <LayoutDashboard className="mr-2 h-4 w-4 text-primary" />
                                                    Quản lý hệ thống
                                                </Button>
                                            </Link>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl"
                                            size="lg"
                                            onClick={() => {
                                                logout();
                                                setIsMenuOpen(false);
                                            }}
                                        >
                                            Đăng xuất
                                        </Button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-xl"
                                            size="lg"
                                        >
                                            Đăng nhập
                                        </Button>
                                    </Link>
                                )}
                                <div className="flex items-center justify-between px-2 py-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Chế độ
                                    </span>
                                    <ModeToggle />
                                </div>
                            </div>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
