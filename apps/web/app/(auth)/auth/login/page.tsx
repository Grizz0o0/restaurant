'use client';

import { useState } from 'react';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Not needed anymore, handled in useAuth
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
// import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/use-auth';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/shared/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/shared/ui/form';
import { toast } from 'sonner';

const schema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
    totpCode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
    const { login, isLoginLoading, loginWithGoogle } = useAuth();
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
        } catch (error: unknown) {
            const err = error as Error;
            // Check for the specific 2FA error message
            if (err?.message?.includes('Error.InvalidTOTPAndCode')) {
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

                                {!show2FA && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <span className="w-full border-t border-border" />
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
                                                <span className="bg-background px-2 text-muted-foreground">
                                                    Hoặc tiếp tục với
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full bg-background border-border"
                                            onClick={loginWithGoogle}
                                            disabled={isLoginLoading}
                                        >
                                            <svg
                                                className="w-5 h-5 mr-2"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    fill="#4285F4"
                                                />
                                                <path
                                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    fill="#34A853"
                                                />
                                                <path
                                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    fill="#FBBC05"
                                                />
                                                <path
                                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    fill="#EA4335"
                                                />
                                            </svg>
                                            Google
                                        </Button>
                                    </>
                                )}

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
