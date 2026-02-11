/**
 * Route configuration for authentication middleware
 */

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
    '/',
    '/menu',
    '/about',
    '/contact',
    '/table', // Allow QR code table access without login
    '/auth', // Allow access to login/register pages
    '/unauthorized', // Error page
    '/forbidden', // Error page
];

/**
 * Auth routes (login, register)
 * Authenticated users should be redirected away from these
 */
export const AUTH_ROUTES = ['/auth/login', '/auth/register'];

/**
 * Protected routes that require authentication
 */
export const PROTECTED_ROUTES = [
    '/profile',
    '/checkout',
    '/cart',
    '/reservation',
];

/**
 * Admin routes that require ADMIN or MANAGER role
 */
export const ADMIN_ROUTES = ['/admin'];

/**
 * Roles allowed to access admin routes
 */
export const ADMIN_ROLES = ['ADMIN', 'MANAGER'];

/**
 * Check if a path matches any of the route patterns
 */
export const matchesRoute = (path: string, routes: string[]): boolean => {
    return routes.some((route) => {
        // Exact match
        if (path === route) return true;
        // Prefix match for routes like /admin/* matching /admin/dashboard
        if (path.startsWith(route + '/')) return true;
        return false;
    });
};

/**
 * Determine if a path is public (doesn't require auth)
 */
export const isPublicRoute = (path: string): boolean => {
    return matchesRoute(path, PUBLIC_ROUTES);
};

/**
 * Determine if a path is an auth route
 */
export const isAuthRoute = (path: string): boolean => {
    return matchesRoute(path, AUTH_ROUTES);
};

/**
 * Determine if a path is protected (requires auth)
 */
export const isProtectedRoute = (path: string): boolean => {
    return matchesRoute(path, PROTECTED_ROUTES);
};

/**
 * Determine if a path is an admin route
 */
export const isAdminRoute = (path: string): boolean => {
    return matchesRoute(path, ADMIN_ROUTES);
};
