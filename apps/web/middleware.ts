import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
    isPublicRoute,
    isAuthRoute,
    isProtectedRoute,
    isAdminRoute,
    ADMIN_ROLES,
} from './lib/auth/route-config';
import { isTokenValid, getUserRoleFromToken } from './lib/auth/jwt';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;

    // Check if token is valid
    const authenticated = isTokenValid(accessToken);
    const userRole = accessToken ? getUserRoleFromToken(accessToken) : null;

    // 1. If user is authenticated and trying to access auth routes (login/register)
    // Redirect to home
    if (authenticated && isAuthRoute(pathname)) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. If route is public, allow access
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // 3. If route is admin and user is not authenticated
    // Redirect to unauthorized page with redirect parameter
    if (isAdminRoute(pathname) && !authenticated) {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(unauthorizedUrl);
    }

    // 4. If route is admin and user doesn't have admin role
    // Redirect to forbidden page
    if (isAdminRoute(pathname) && authenticated) {
        const hasAdminRole = userRole && ADMIN_ROLES.includes(userRole);
        if (!hasAdminRole) {
            // Redirect to forbidden page (403)
            const forbiddenUrl = new URL('/forbidden', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }

    // 5. If route is protected (profile, checkout, etc.) and user is not authenticated
    // Redirect to unauthorized page with redirect parameter
    if (isProtectedRoute(pathname) && !authenticated) {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(unauthorizedUrl);
    }

    // 6. For all other cases, allow the request to proceed
    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
