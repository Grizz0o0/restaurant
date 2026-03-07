import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { serverTrpc } from '@/lib/trpc/server-client';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};

const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state') || ''; // State might be empty depending on the initial request, but we need to pass a string

        if (!code) {
            return NextResponse.redirect(
                new URL(
                    '/auth/login?error=invalid_google_callback',
                    request.url,
                ),
            );
        }

        // Call backend using serverTrpc to exchange code for tokens
        const result = await serverTrpc.auth.googleCallback.mutate({
            code,
            state,
        });

        const { accessToken, refreshToken } = result;

        const cookieStore = await cookies();
        cookieStore.set('accessToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
        });

        cookieStore.set('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE,
        });

        // Redirect to home page upon successful login
        return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
        console.error('Google callback error:', error);
        return NextResponse.redirect(
            new URL('/auth/login?error=google_login_failed', request.url),
        );
    }
}
