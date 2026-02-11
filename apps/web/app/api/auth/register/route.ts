import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052';

// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Format request for TRPC
        const trpcRequest = {
            0: {
                json: body,
            },
        };

        // Call NestJS backend register endpoint
        const response = await fetch(
            `${BACKEND_URL}/v1/api/trpc/auth.register`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trpcRequest),
            },
        );

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        const { accessToken, refreshToken } = data.result.data;

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

        // Return success
        return NextResponse.json({
            success: true,
            message: 'Đăng ký thành công',
        });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
