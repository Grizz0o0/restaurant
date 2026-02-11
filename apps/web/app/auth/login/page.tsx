'use client';

import { useState } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Not needed anymore, handled in useAuth
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import { ArrowLeft } from 'lucide-react';
import { LoginBodySchema } from '@repo/schema';
import { useAuth } from '@/hooks/domain/use-auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

const schema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
    totpCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
    const { login, isLoginLoading } = useAuth();
    const [show2FA, setShow2FA] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '', totpCode: '' },
    });

    const onSubmit = async (values: FormValues) => {
        try {
            // Clean up empty strings to match backend expectations (undefined vs empty string)
            const payload = {
                ...values,
                totpCode: values.totpCode || undefined,
            };
            await login(payload);
        } catch (error: any) {
            // Check for the specific 2FA error message
            if (error?.message?.includes('Error.InvalidTOTPAndCode')) {
                setShow2FA(true);
                toast.info('Vui lòng nhập mã xác thực 2FA');
                form.setFocus('totpCode');
                return;
            }
            // If it's another error not handled by useAuth (unlikely but safe)
            console.error('Login error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                <Card className="rounded-2xl shadow-card border-border">
                    <CardHeader>
                        <CardTitle className="font-display text-2xl">
                            Đăng nhập
                        </CardTitle>
                        <CardDescription>
                            {show2FA
                                ? 'Nhập mã xác thực từ ứng dụng Authenticator.'
                                : 'Đăng nhập để xem hồ sơ và đặt hàng nhanh hơn.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-5"
                            >
                                {!show2FA ? (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="email"
                                                            placeholder="email@example.com"
                                                            autoComplete="email"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Mật khẩu
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            autoComplete="current-password"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name="totpCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Mã xác thực 2FA
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="123456"
                                                        maxLength={6}
                                                        autoComplete="one-time-code"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <Button
                                    type="submit"
                                    variant="hero"
                                    className="w-full"
                                    disabled={isLoginLoading}
                                >
                                    {isLoginLoading
                                        ? 'Đang xử lý...'
                                        : show2FA
                                          ? 'Xác thực'
                                          : 'Đăng nhập'}
                                </Button>

                                <div className="text-center text-sm">
                                    <span className="text-muted-foreground">
                                        Chưa có tài khoản?{' '}
                                    </span>
                                    <Link
                                        href="/auth/register"
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Đăng ký
                                    </Link>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
