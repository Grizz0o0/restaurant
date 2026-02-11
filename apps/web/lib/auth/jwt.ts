/**
 * JWT utilities for middleware
 * Note: These are lightweight utilities that don't verify signatures
 * They're used for quick checks in middleware before the backend validates
 */

interface JWTPayload {
    userId: string;
    deviceId: string;
    roleId: string;
    roleName: string;
    uuid: string;
    iat: number;
    exp: number;
}

/**
 * Decode JWT token without verification
 * This is safe for middleware as we only read claims, not trust them
 */
export const decodeToken = (token: string): JWTPayload | null => {
    try {
        // JWT format: header.payload.signature
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        // Decode the payload (base64url)
        const payload = parts[1];
        if (!payload) {
            return null;
        }
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(decoded) as JWTPayload;
    } catch (error) {
        console.error('Failed to decode JWT:', error);
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
        return true;
    }

    // exp is in seconds, Date.now() is in milliseconds
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
};

/**
 * Extract user role from token
 */
export const getUserRoleFromToken = (token: string): string | null => {
    const payload = decodeToken(token);
    return payload?.roleName || null;
};

/**
 * Check if token is valid (exists and not expired)
 */
export const isTokenValid = (token: string | undefined): boolean => {
    if (!token) return false;
    return !isTokenExpired(token);
};
