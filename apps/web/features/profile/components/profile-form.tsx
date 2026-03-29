'use client';

import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { trpc } from '@/lib/trpc/client';
import { Separator } from '@/shared/ui/separator';
import { AvatarUpload } from '@/shared/ui/avatar-upload';

const schema = z.object({
    display_name: z.string().trim().max(100).optional().or(z.literal('')),
    phone: z.string().trim().max(50).optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    avatar_url: z.string().trim().max(1000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const utils = trpc.useUtils();

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            display_name: '',
            phone: '',
            email: '',
            avatar_url: '',
        },
    });

    // Populate form when user data is available
    useEffect(() => {
        if (user && !form.formState.isDirty) {
            form.reset({
                display_name: user.name || '',
                phone: user.phoneNumber || '',
                email: user.email || '',
                avatar_url: user.avatar || '',
            });
        }
    }, [user, form]);

    const updateProfileMutation = trpc.profile.updateProfile.useMutation({
        onSuccess: () => {
            toast.success('Đã lưu hồ sơ');
            utils.profile.getProfile.invalidate();
        },
        onError: (error) => {
            toast.error(error.message || 'Cập nhật hồ sơ thất bại');
        },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            await updateProfileMutation.mutateAsync({
                name: values.display_name || undefined,
                phoneNumber: values.phone || undefined,
                avatar: values.avatar_url || undefined,
            });
        } catch (error) {
            // Handled in onError
        }
    };

    if (isAuthLoading) {
        return <p>Đang tải...</p>;
    }

    if (!user) {
        return (
            <div className="text-center">
                <p className="mb-4">Bạn chưa đăng nhập</p>
                <Button onClick={() => (window.location.href = '/auth/login')}>
                    Đăng nhập ngay
                </Button>
            </div>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar Column */}
                    <div className="shrink-0">
                        <FormField
                            control={form.control}
                            name="avatar_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <AvatarUpload
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Info Column */}
                    <div className="flex-1 space-y-6">
                        <FormField
                            control={form.control}
                            name="display_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên hiển thị</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ví dụ: Minh"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled
                                                className="bg-muted"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Số điện thoại</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="0909 123 456"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-start">
                    <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="min-w-30"
                    >
                        {updateProfileMutation.isPending
                            ? 'Đang lưu...'
                            : 'Lưu thay đổi'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
