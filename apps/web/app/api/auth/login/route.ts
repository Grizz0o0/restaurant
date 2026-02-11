import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverTrpc } from '@/lib/trpc/server-client';

// Cookie configuration matching our security requirements
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Call backend using TRPC client (handles all formatting automatically)
        const result = await serverTrpc.auth.login.mutate(body);

        const { accessToken, refreshToken } = result;

        // Set httpOnly cookies
        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
        });

        cookieStore.set('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE,
        });

        // Return success without tokens (they're in cookies now)
        return NextResponse.json({
            success: true,
            message: 'Đăng nhập thành công',
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: error.message || 'Đăng nhập thất bại' },
            { status: error.data?.httpStatus || 500 },
        );
    }
}
