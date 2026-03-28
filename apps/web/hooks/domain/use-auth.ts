import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { clearAuthTokens } from '@/lib/auth/cookies';
import { useState } from 'react';

export const useAuth = () => {
    const router = useRouter();
    const utils = trpc.useUtils();


    const {
        data: user,
        isLoading,
        refetch,
    } = trpc.profile.getProfile.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });


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


            utils.profile.getProfile.invalidate();
            toast.success('Đăng ký thành công');
            router.push('/');
        } catch (error: any) {
            toast.error(error.message || 'Đăng ký thất bại');
        } finally {
            setIsRegisterLoading(false);
        }
    };


    const sendOTPMutation = trpc.auth.sendOTP.useMutation({
        onSuccess: () => {
            toast.success('Mã OTP đã được gửi đến email của bạn');
        },
        onError: (error) => {
            toast.error(error.message || 'Gửi OTP thất bại');
        },
    });


    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            clearAuthTokens();
            toast.success('Đăng xuất thành công');
            window.location.href = '/auth/login';
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Đăng xuất thất bại');
        }
    };


    const loginWithGoogle = async () => {
        setIsLoginLoading(true);
        try {
            const result = await utils.auth.googleUrl.fetch();
            if (result && result.url) {
                window.location.href = result.url;
            }
        } catch (error) {
            console.error('Lỗi khi lấy link Google OAuth:', error);
            toast.error('Không thể kết nối với Google');
            setIsLoginLoading(false);
        }
    };

    return {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        isLoginLoading,
        loginWithGoogle,
        register,
        isRegisterLoading,
        sendOTP: sendOTPMutation.mutate,
        sendOTPAsync: sendOTPMutation.mutateAsync,
        logout,
        refetch,
    };
};
