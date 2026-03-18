import Cookies from 'js-cookie';

// Cookie configuration
const COOKIE_CONFIG = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    ACCESS_TOKEN_EXPIRES: 1 / (24 * 60),
    REFRESH_TOKEN_EXPIRES: 7,
    ACCESS_TOKEN_OPTIONS: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
    },
    REFRESH_TOKEN_OPTIONS: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        httpOnly: true,
    },
};

/**
 * Set authentication tokens in cookies
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
