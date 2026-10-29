import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

let hasWarnedDisabled = false;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

let redirectLimiter: Ratelimit | null = null;
let apiV1Limiter: Ratelimit | null = null;
let registerLimiter: Ratelimit | null = null;

function getRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!hasWarnedDisabled) {
      console.warn(
        '[RateLimit] UPSTASH_REDIS_REST_URL and/or UPSTASH_REDIS_REST_TOKEN are absent. Rate limiting is running in bypass mode.'
      );
      hasWarnedDisabled = true;
    }
    return null;
  }

  return new Redis({ url, token });
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * 300 req/min per IP for GET /r/[shortCode]
 */
export async function limitRedirect(ip: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { success: true, limit: 300, remaining: 300, reset: 0 };
  }

  if (!redirectLimiter) {
    redirectLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, '1 m'),
      prefix: 'ratelimit:r',
    });
  }

  return await redirectLimiter.limit(ip);
}

/**
 * 60 req/min per API key (keyed by hash) for /api/v1/qr-codes*
 */
export async function limitApiV1(apiKeyHash: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { success: true, limit: 60, remaining: 60, reset: 0 };
  }

  if (!apiV1Limiter) {
    apiV1Limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      prefix: 'ratelimit:apiv1',
    });
  }

  return await apiV1Limiter.limit(apiKeyHash);
}

/**
 * 5 req/15min per IP for POST /api/auth/register
 */
export async function limitRegister(ip: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { success: true, limit: 5, remaining: 5, reset: 0 };
  }

  if (!registerLimiter) {
    registerLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      prefix: 'ratelimit:register',
    });
  }

  return await registerLimiter.limit(ip);
}

/**
 * Generates a standard JSON 429 response with Retry-After header.
 */
export function rateLimitJsonResponse(resetMs: number) {
  const retryAfter = resetMs > 0 ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)) : 60;
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Generates a standard plain text 429 response with Retry-After header for redirects.
 */
export function rateLimitRedirectResponse(resetMs: number) {
  const retryAfter = resetMs > 0 ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)) : 60;
  return new NextResponse('Too many requests. Please try again later.', {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'Content-Type': 'text/plain',
    },
  });
}
