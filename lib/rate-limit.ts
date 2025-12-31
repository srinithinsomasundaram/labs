import { NextRequest } from 'next/server';

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {};

export interface RateLimitConfig {
    interval: number; // in milliseconds
    uniqueTokenPerInterval: number; // max requests per interval
}

/**
 * Rate limit by IP address
 */
export async function rateLimit(
    request: NextRequest,
    config: RateLimitConfig = {
        interval: 60 * 1000, // 1 minute
        uniqueTokenPerInterval: 10, // 10 requests per minute
    }
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const now = Date.now();
    const key = `ratelimit:${ip}`;

    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
        delete store[key];
    }

    // Initialize or get current count
    if (!store[key]) {
        store[key] = {
            count: 0,
            resetTime: now + config.interval,
        };
    }

    store[key].count++;

    const remaining = config.uniqueTokenPerInterval - store[key].count;
    const reset = store[key].resetTime;

    if (store[key].count > config.uniqueTokenPerInterval) {
        return {
            success: false,
            remaining: 0,
            reset,
        };
    }

    return {
        success: true,
        remaining,
        reset,
    };
}

/**
 * Rate limit by user ID
 */
export async function rateLimitByUser(
    userId: string,
    config: RateLimitConfig = {
        interval: 60 * 1000,
        uniqueTokenPerInterval: 20,
    }
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
    const now = Date.now();
    const key = `ratelimit:user:${userId}`;

    if (store[key] && store[key].resetTime < now) {
        delete store[key];
    }

    if (!store[key]) {
        store[key] = {
            count: 0,
            resetTime: now + config.interval,
        };
    }

    store[key].count++;

    const remaining = config.uniqueTokenPerInterval - store[key].count;
    const reset = store[key].resetTime;

    if (store[key].count > config.uniqueTokenPerInterval) {
        return {
            success: false,
            remaining: 0,
            reset,
        };
    }

    return {
        success: true,
        remaining,
        reset,
    };
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
    setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
