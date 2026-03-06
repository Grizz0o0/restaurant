'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const settingsSchema = z.object({
    name: z.string().min(1, 'Vui lòng nhập tên nhà hàng'),
    address: z.string().min(1, 'Vui lòng nhập địa chỉ'),
    phone: z.string().optional(),
    logo: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
    const [restaurant] = trpc.restaurant.getMain.useSuspenseQuery();
    const utils = trpc.useUtils();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: restaurant?.name || '',
            address: restaurant?.address || '',
            phone: restaurant?.phone || '',
            logo: restaurant?.logo || '',
        },
    });

    // Keep form in sync if data changes
    useEffect(() => {
        if (restaurant) {
            reset({
                name: restaurant.name,
                address: restaurant.address,
                phone: restaurant.phone || '',
                logo: restaurant.logo || '',
            });
        }
    }, [restaurant, reset]);

    const updateMutation = trpc.restaurant.update.useMutation({
        onSuccess: () => {
            utils.restaurant.getMain.invalidate();
            toast.success('Cập nhật thông tin thành công!');
        },
        onError: (error) => {
            toast.error(`Lỗi: ${error.message}`);
        },
    });

    const onSubmit = (data: SettingsFormValues) => {
        if (!restaurant) return;
        updateMutation.mutate({
            id: restaurant.id,
            data,
        });
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Cài đặt hệ thống
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="col-span-2 rounded-xl border bg-card text-card-foreground shadow">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight">
                            Thông tin chung
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Cập nhật thông tin cơ bản của nhà hàng
                        </p>
                    </div>
                    <div className="p-6 pt-0">
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <label
                                    htmlFor="name"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Tên nhà hàng{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    {...register('name')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Nhập tên nhà hàng"
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="address"
                                    className="text-sm font-medium leading-none"
                                >
                                    Địa chỉ{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="address"
                                    {...register('address')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Nhập địa chỉ"
                                />
                                {errors.address && (
                                    <p className="text-sm text-red-500">
                                        {errors.address.message}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium leading-none"
                                >
                                    Số điện thoại liện hệ
                                </label>
                                <input
                                    id="phone"
                                    {...register('phone')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="Ví dụ: 0912345678"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="logo"
                                    className="text-sm font-medium leading-none"
                                >
                                    Đường dẫn Logo (URL)
                                </label>
                                <input
                                    id="logo"
                                    {...register('logo')}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    placeholder="https://..."
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting || updateMutation.isPending
                                }
                            >
                                {isSubmitting || updateMutation.isPending
                                    ? 'Đang lưu...'
                                    : 'Lưu thay đổi'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
