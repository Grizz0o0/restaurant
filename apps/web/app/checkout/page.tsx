'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/domain/use-auth';
import { trpc } from '@/lib/trpc/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Loader2, MapPin, CreditCard, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { AddressForm } from '@/components/profile/address-form';

export default function CheckoutPage() {
    const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const utils = trpc.useUtils();

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string>('');
    const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);

    // Fetch Cart Data to display summary
    const { data: cartData, isLoading: isCartLoading } = trpc.cart.get.useQuery(
        undefined,
        { enabled: isAuthenticated },
    );

    // Fetch Addresses
    const { data: addresses, isLoading: isAddressesLoading } =
        trpc.address.list.useQuery(
            { page: 1, limit: 50 },
            { enabled: isAuthenticated },
        );

    // Auto-select default address
    useEffect(() => {
        if (addresses && addresses.length > 0 && !selectedAddressId) {
            const defaultAddress = addresses.find((a) => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
            } else if (addresses[0]) {
                setSelectedAddressId(addresses[0].id);
            }
        }
    }, [addresses, selectedAddressId]);

    const createOrderMutation = trpc.order.createFromCart.useMutation({
        onSuccess: (order) => {
            toast.success('Đặt hàng thành công!');
            utils.cart.get.invalidate();
            router.push(`/checkout/success?orderId=${order.id}`);
        },
        onError: (error) => {
            toast.error(error.message || 'Có lỗi xảy ra khi tạo đơn hàng');
            setIsSubmitting(false);
        },
    });

    const handlePlaceOrder = () => {
        if (!selectedAddressId) {
            toast.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }

        setIsSubmitting(true);
        createOrderMutation.mutate({
            addressId: selectedAddressId,
            guestInfo: {
                paymentMethod: paymentMethod,
                phoneNumber: user?.phoneNumber,
            },
            promotionCode: undefined, // Add logic for this later if needed
        });
    };

    // Handle redirects
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            router.push('/auth/login?redirect=/checkout');
        }
    }, [isAuthLoading, isAuthenticated, router]);

    useEffect(() => {
        if (!isCartLoading && cartData && cartData.items.length === 0) {
            router.push('/cart');
        }
    }, [isCartLoading, cartData, router]);

    if (
        isAuthLoading ||
        isCartLoading ||
        !isAuthenticated ||
        !cartData ||
        cartData.items.length === 0
    ) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const subtotal = cartData.total || 0;
    const deliveryFee = subtotal > 100000 ? 0 : 15000;
    const total = subtotal + deliveryFee;

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);

    return (
        <div className="min-h-screen bg-background py-12">
            <div className="container px-4 md:px-6">
                <h1 className="text-3xl font-bold font-display mb-8">
                    Thanh toán
                </h1>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column: Address & Payment */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Shipping Address */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Thông tin giao hàng
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsAddressFormOpen(true)}
                                >
                                    <span className="mr-1">+</span> Thêm mới
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isAddressesLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : addresses && addresses.length > 0 ? (
                                    <RadioGroup
                                        value={selectedAddressId}
                                        onValueChange={setSelectedAddressId}
                                        className="grid gap-4 sm:grid-cols-2"
                                    >
                                        {addresses.map((addr) => (
                                            <div key={addr.id}>
                                                <RadioGroupItem
                                                    value={addr.id}
                                                    id={addr.id}
                                                    className="peer sr-only"
                                                />
                                                <Label
                                                    htmlFor={addr.id}
                                                    className="flex flex-col gap-2 rounded-lg border border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold">
                                                            {addr.label}
                                                        </span>
                                                        {addr.isDefault && (
                                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                                Mặc định
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm space-y-1 text-muted-foreground">
                                                        <p className="font-medium text-foreground">
                                                            {addr.recipientName}{' '}
                                                            - {addr.phoneNumber}
                                                        </p>
                                                        <p className="line-clamp-2">
                                                            {addr.address}
                                                        </p>
                                                    </div>
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed rounded-lg">
                                        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground mb-4">
                                            Bạn chưa có địa chỉ giao hàng nào
                                        </p>
                                        <Button
                                            onClick={() =>
                                                setIsAddressFormOpen(true)
                                            }
                                        >
                                            Thêm địa chỉ ngay
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Phương thức thanh toán
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    value={paymentMethod}
                                    onValueChange={setPaymentMethod}
                                    className="grid gap-4"
                                >
                                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                        <RadioGroupItem value="COD" id="cod" />
                                        <Label
                                            htmlFor="cod"
                                            className="flex-1 cursor-pointer"
                                        >
                                            Thanh toán khi nhận hàng (COD)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5">
                                        <RadioGroupItem
                                            value="BANKing"
                                            id="banking"
                                        />
                                        <Label
                                            htmlFor="banking"
                                            className="flex-1 cursor-pointer"
                                        >
                                            Chuyển khoản ngân hàng
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle>Đơn hàng của bạn</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Items List (Simplified) */}
                                <div className="space-y-4 max-h-75 overflow-y-auto pr-2">
                                    {cartData.items.map((item: any) => {
                                        const dishName =
                                            item.sku?.dish
                                                ?.dishTranslations?.[0]?.name ||
                                            'Món ăn';
                                        const image =
                                            item.sku?.dish?.images?.[0] ||
                                            '/images/placeholder-dish.jpg';
                                        const price = Number(
                                            item.sku?.price || 0,
                                        );

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex gap-3"
                                            >
                                                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                                                    <Image
                                                        src={image}
                                                        alt={dishName}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {dishName}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        SL: {item.quantity}
                                                    </p>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {formatPrice(
                                                        price * item.quantity,
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Separator />

                                {/* Calculations */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Tạm tính
                                        </span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Phí vận chuyển
                                        </span>
                                        <span>
                                            {deliveryFee === 0
                                                ? 'Miễn phí'
                                                : formatPrice(deliveryFee)}
                                        </span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Tổng cộng</span>
                                        <span className="text-primary">
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    {isSubmitting
                                        ? 'Đang xử lý...'
                                        : 'Đặt hàng'}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span>
                                        Thông tin được bảo mật tuyệt đối
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <AddressForm
                open={isAddressFormOpen}
                onOpenChange={setIsAddressFormOpen}
                onSuccess={() => utils.address.list.invalidate()}
            />
        </div>
    );
}
