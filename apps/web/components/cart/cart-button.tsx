'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/use-ui-store';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { useAuth } from '@/hooks/domain/use-auth';

export function CartButton() {
    const toggleCart = useUIStore((state) => state.toggleCart);
    const { user } = useAuth();
    const { data: cart } = trpc.cart.get.useQuery(undefined, {
        enabled: !!user,
    });

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const itemCount =
        cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="w-5 h-5" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleCart}
            className="relative"
        >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-chili text-[10px] font-bold text-white border-2 border-background animate-scale-in">
                    {itemCount}
                </span>
            )}
        </Button>
    );
}
