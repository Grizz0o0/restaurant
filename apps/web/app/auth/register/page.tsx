'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterBodySchema } from '@repo/schema';
import { TypeOfValidationCode } from '@repo/constants';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { useAuth } from '@/hooks/domain/use-auth';
import { useState } from 'react';

type FormValues = z.infer<typeof RegisterBodySchema>;

export default function RegisterPage() {
    const { register, sendOTPAsync, isRegisterLoading } = useAuth();
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const form = useForm<FormValues>({
        resolver: zodResolver(RegisterBodySchema),
        defaultValues: {
            name: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
            code: '',
        },
    });

    const handleSendOTP = async () => {
        const email = form.getValues('email');
        if (!email) {
            form.setError('email', { message: 'Vui lòng nhập email trước' });
            return;
        }
        try {
            await sendOTPAsync({
                email,
                type: TypeOfValidationCode.REGISTER,
            });
            setOtpSent(true);
            setCountdown(60);
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (error) {
            // Toast handled in hook
        }
    };

    const onSubmit = async (values: FormValues) => {
        try {
            await register(values);
        } catch (error) {
            // Toast handled in hook
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md space-y-8">
                <Card className="rounded-2xl shadow-card border-border">
                    <CardHeader>
                        <CardTitle className="font-display text-2xl">
                            Đăng ký
                        </CardTitle>
                        <CardDescription>
                            Tạo tài khoản để lưu hồ sơ và quản lý đơn hàng.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-4"
                            >
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Họ và tên</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nguyễn Văn A"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="email@example.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phoneNumber"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Số điện thoại
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="0912..."
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="flex gap-2 items-end">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormLabel>
                                                    Mã xác thực (OTP)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nhập mã 6 số từ email"
                                                        maxLength={6}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSendOTP}
                                        disabled={
                                            isRegisterLoading || countdown > 0
                                        }
                                        className="mb-2 shrink-0 min-w-25"
                                    >
                                        {countdown > 0
                                            ? `${countdown}s`
                                            : otpSent
                                              ? 'Gửi lại'
                                              : 'Lấy mã'}
                                    </Button>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mật khẩu</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nhập lại mật khẩu
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    autoComplete="new-password"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    variant="hero"
                                    className="w-full mt-4"
                                    disabled={isRegisterLoading}
                                >
                                    {isRegisterLoading
                                        ? 'Đang xử lý...'
                                        : 'Đăng ký'}
                                </Button>

                                <div className="text-center text-sm mt-4">
                                    <span className="text-muted-foreground">
                                        Đã có tài khoản?{' '}
                                    </span>
                                    <Link
                                        href="/auth/login"
                                        className="font-medium text-primary hover:underline"
                                    >
                                        Đăng nhập
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
