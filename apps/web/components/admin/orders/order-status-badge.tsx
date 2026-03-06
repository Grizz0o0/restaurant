import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Clock,
    ChefHat,
    ShoppingBag,
    Bike,
    CheckCircle2,
    CheckSquare,
    XCircle,
    AlertCircle,
} from 'lucide-react';

export type OrderStatus =
    | 'PENDING_CONFIRMATION'
    | 'PREPARING'
    | 'READY_FOR_PICKUP'
    | 'DELIVERING'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED';

const STATUS_CONFIG: Record<
    OrderStatus,
    { label: string; icon: React.ElementType; colorClass: string }
> = {
    PENDING_CONFIRMATION: {
        label: 'Chờ xác nhận',
        icon: Clock,
        colorClass:
            'bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200',
    },
    PREPARING: {
        label: 'Đang chuẩn bị',
        icon: ChefHat,
        colorClass:
            'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    },
    READY_FOR_PICKUP: {
        label: 'Sẵn sàng',
        icon: ShoppingBag,
        colorClass:
            'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200',
    },
    DELIVERING: {
        label: 'Đang giao',
        icon: Bike,
        colorClass: 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200',
    },
    DELIVERED: {
        label: 'Đã giao',
        icon: CheckSquare,
        colorClass:
            'bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200',
    },
    COMPLETED: {
        label: 'Hoàn thành',
        icon: CheckCircle2,
        colorClass:
            'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200',
    },
    CANCELLED: {
        label: 'Đã hủy',
        icon: XCircle,
        colorClass:
            'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200',
    },
};

interface OrderStatusBadgeProps {
    status: string;
    className?: string;
    showIcon?: boolean;
}

export function OrderStatusBadge({
    status,
    className,
    showIcon = true,
}: OrderStatusBadgeProps) {
    const config = STATUS_CONFIG[status as OrderStatus] || {
        label: status,
        icon: AlertCircle,
        colorClass: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    const Icon = config.icon;

    return (
        <Badge
            variant="outline"
            className={cn(
                'flex w-fit items-center gap-1.5 px-2.5 py-0.5 whitespace-nowrap font-medium transition-colors',
                config.colorClass,
                className,
            )}
        >
            {showIcon && <Icon className="h-3.5 w-3.5" />}
            {config.label}
        </Badge>
    );
}
