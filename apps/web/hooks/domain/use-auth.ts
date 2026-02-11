import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { clearAuthTokens } from '@/lib/auth/cookies';
import { useState } from 'react';

export const useAuth = () => {
    const router = useRouter();
    const utils = trpc.useUtils();

    // Query current user profile
    const {
        data: user,
        isLoading,
        refetch,
    } = trpc.profile.getProfile.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    // Login using Next.js API route
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const login = async (input: any) => {
        setIsLoginLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Đăng nhập thất bại');
            }

            // Invalidate profile query to fetch user data
            utils.profile.getProfile.invalidate();
            toast.success('Đăng nhập thành công');
            router.push('/');
        } catch (error: any) {
            if (error.message?.includes('Error.InvalidTOTPAndCode')) return;
            toast.error(error.message || 'Đăng nhập thất bại');
        } finally {
            setIsLoginLoading(false);
        }
    };

    // Register using Next.js API route
    const [isRegisterLoading, setIsRegisterLoading] = useState(false);
    const register = async (input: any) => {
        setIsRegisterLoading(true);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Đăng ký thất bại');
            }

            // Auto-login after registration
            utils.profile.getProfile.invalidate();
            toast.success('Đăng ký thành công');
            router.push('/');
        } catch (error: any) {
            toast.error(error.message || 'Đăng ký thất bại');
        } finally {
            setIsRegisterLoading(false);
        }
    };

    // Send OTP (still using TRPC)
    const sendOTPMutation = trpc.auth.sendOTP.useMutation({
        onSuccess: () => {
            toast.success('Mã OTP đã được gửi đến email của bạn');
        },
        onError: (error) => {
            toast.error(error.message || 'Gửi OTP thất bại');
        },
    });

    // Logout using Next.js API route
    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            clearAuthTokens();
            // Clear cached data
            utils.invalidate();
            toast.success('Đăng xuất thành công');
            router.push('/auth/login');
        } catch (error) {
            toast.error('Đăng xuất thất bại');
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        isLoginLoading,
        register,
        isRegisterLoading,
        sendOTP: sendOTPMutation.mutate,
        sendOTPAsync: sendOTPMutation.mutateAsync,
        logout,
        refetch,
    };
};
