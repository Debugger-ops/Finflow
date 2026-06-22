// app/libs/ratelimit.ts
// Sliding-window rate limiting backed by Upstash. Degrades to "allow all"
// when Redis is not configured, so the app never hard-fails in local dev.
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { redis } from "./redis";

function make(limit: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: "finflow/rl",
  });
}

// Tunable buckets per sensitivity.
export const limiters = {
  auth: make(5, "1 m"), // login/register: 5 / minute
  money: make(20, "1 m"), // transfers/orders: 20 / minute
  read: make(60, "1 m"), // price reads etc.
};

/** Returns the client IP from common proxy headers. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "anonymous"
  );
}

/**
 * Guard a route. Returns a 429 NextResponse when over the limit, otherwise null.
 * Usage:  const limited = await enforce(limiters.auth, key); if (limited) return limited;
 */
export async function enforce(
  limiter: Ratelimit | null,
  key: string,
): Promise<NextResponse | null> {
  if (!limiter) return null; // Redis not configured → allow.
  const { success, limit, remaining, reset } = await limiter.limit(key);
  if (success) return null;
  return NextResponse.json(
    { message: "Too many requests. Please slow down." },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
      },
    },
  );
}
