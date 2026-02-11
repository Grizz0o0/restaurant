import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        // Extract path from URL pathname (e.g., /api/trpc/cart.get or /api/trpc/cart.get,category.list)
        const pathParts = url.pathname.split('/api/trpc/');
        const path = pathParts[1] || '';

        // Get access token from cookies
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;

        // Forward request to NestJS backend
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add authorization header if token exists
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(
            `${BACKEND_URL}/v1/api/trpc/${path}${url.search}`,
            {
                method: request.method,
                headers,
                body:
                    request.method !== 'GET' ? await request.text() : undefined,
            },
        );

        const data = await response.text();

        return new NextResponse(data, {
            status: response.status,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error('TRPC proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function GET(request: NextRequest) {
    return POST(request);
}
