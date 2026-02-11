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

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get('refreshToken')?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'No refresh token found' },
                { status: 401 },
            );
        }

        // Format request for TRPC
        const trpcRequest = {
            0: {
                json: {
                    refreshToken,
                },
            },
        };

        // Call NestJS backend refresh endpoint
        const response = await fetch(
            `${BACKEND_URL}/v1/api/trpc/auth.refreshToken`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(trpcRequest),
            },
        );

        if (!response.ok) {
            // Clear cookies if refresh fails
            cookieStore.delete('accessToken');
            cookieStore.delete('refreshToken');

            const error = await response.json();
            return NextResponse.json(error, { status: response.status });
        }

        const data = await response.json();
        const { accessToken, refreshToken: newRefreshToken } = data.result.data;

        // Update cookies with new tokens
        cookieStore.set('accessToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: ACCESS_TOKEN_MAX_AGE,
        });

        cookieStore.set('refreshToken', newRefreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_TOKEN_MAX_AGE,
        });

        return NextResponse.json({
            success: true,
            message: 'Token refreshed successfully',
        });
    } catch (error) {
        console.error('Refresh error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
