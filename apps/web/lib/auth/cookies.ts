import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    // 7 days for access token (adjust as needed)
    ACCESS_TOKEN_EXPIRES: 7,
    // 30 days for refresh token
    REFRESH_TOKEN_EXPIRES: 30,
    // Cookie options for accessToken (readable by JS for client-side use)
    ACCESS_TOKEN_OPTIONS: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        // httpOnly: false - allows client-side JavaScript to read
    },
    // Cookie options for refreshToken (httpOnly for security)
    REFRESH_TOKEN_OPTIONS: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        httpOnly: true, // Cannot be read by JavaScript - more secure
    },
};

/**
 * Set authentication tokens in cookies
 * - accessToken: readable by JS (for client-side auth checks)
 * - refreshToken: httpOnly (more secure, only sent with requests)
 */
export const setAuthTokens = (
    accessToken: string,
    refreshToken: string,
): void => {
    Cookies.set(COOKIE_CONFIG.ACCESS_TOKEN, accessToken, {
        ...COOKIE_CONFIG.ACCESS_TOKEN_OPTIONS,
        expires: COOKIE_CONFIG.ACCESS_TOKEN_EXPIRES,
    });

    Cookies.set(COOKIE_CONFIG.REFRESH_TOKEN, refreshToken, {
        ...COOKIE_CONFIG.REFRESH_TOKEN_OPTIONS,
        expires: COOKIE_CONFIG.REFRESH_TOKEN_EXPIRES,
    });
};

/**
 * Get access token from cookie
 */
export const getAccessToken = (): string | undefined => {
    return Cookies.get(COOKIE_CONFIG.ACCESS_TOKEN);
};

/**
 * Get refresh token from cookie
 */
export const getRefreshToken = (): string | undefined => {
    return Cookies.get(COOKIE_CONFIG.REFRESH_TOKEN);
};

/**
 * Clear all authentication tokens
 */
export const clearAuthTokens = (): void => {
    Cookies.remove(COOKIE_CONFIG.ACCESS_TOKEN, { path: '/' });
    Cookies.remove(COOKIE_CONFIG.REFRESH_TOKEN, { path: '/' });
};

/**
 * Check if user is authenticated (has access token)
 */
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};
