import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkCompatProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
    activeClassName?: string;
    pendingClassName?: string; // Not used in Next.js but kept for compat
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
    ({ className, activeClassName, to, children, ...props }, ref) => {
        const pathname = usePathname();
        // Simple active check: true if pathname starts with the link path
        // For root "/", exact match is usually better, but for others prefix is common.
        // Adjust based on typical usage. The original used generic matching via react-router.
        const isActive =
            to === '/' ? pathname === '/' : pathname?.startsWith(to);

        return (
            <Link
                ref={ref}
                href={to}
                className={cn(className, isActive && activeClassName)}
                {...props}
            >
                {children}
            </Link>
        );
    },
);

NavLink.displayName = 'NavLink';

export { NavLink };
