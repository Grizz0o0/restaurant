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

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('accessToken')?.value;


    const authenticated = isTokenValid(accessToken);
    const userRole = accessToken ? getUserRoleFromToken(accessToken) : null;


    if (authenticated && isAuthRoute(pathname)) {
        return NextResponse.redirect(new URL('/', request.url));
    }


    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }


    if (isAdminRoute(pathname) && !authenticated) {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(unauthorizedUrl);
    }


    if (isAdminRoute(pathname) && authenticated) {
        const hasAdminRole = userRole && ADMIN_ROLES.includes(userRole);
        if (!hasAdminRole) {

            const forbiddenUrl = new URL('/forbidden', request.url);
            return NextResponse.redirect(forbiddenUrl);
        }
    }


    if (isProtectedRoute(pathname) && !authenticated) {
        const unauthorizedUrl = new URL('/unauthorized', request.url);
        unauthorizedUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(unauthorizedUrl);
    }


    return NextResponse.next();
}

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
