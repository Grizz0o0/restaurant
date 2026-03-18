import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Cookie configuration
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 1 * 24 * 60 * 60; // 1 days (seconds)

export async function POST(request: NextRequest) {
    try {
        const { accessToken, refreshToken } = await request.json();

        // Set httpOnly cookies for guest session
        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
        });

        if (refreshToken) {
            cookieStore.set('refreshToken', refreshToken, {
                ...COOKIE_OPTIONS,
                maxAge: ACCESS_TOKEN_MAX_AGE,
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Guest login successful',
        });
    } catch (error) {
        console.error('Guest login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
