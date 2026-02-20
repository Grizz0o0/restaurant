import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3052';

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const folder = url.searchParams.get('folder') || 'general';

        // Get access token from httpOnly cookies
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json(
                { message: 'Unauthorized: No access token found' },
                { status: 401 },
            );
        }

        // Get the form data from the incoming request
        const formData = await request.formData();

        // Forward to NestJS backend
        const response = await fetch(
            `${BACKEND_URL}/v1/api/uploads?folder=${folder}`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                body: formData,
            },
        );

        const data = await response.json();

        return NextResponse.json(data, {
            status: response.status,
        });
    } catch (error: any) {
        console.error('Upload proxy error:', error);
        return NextResponse.json(
            { message: error.message || 'Internal server error' },
            { status: 500 },
        );
    }
}
