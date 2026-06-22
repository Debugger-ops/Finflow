// app/libs/redis.ts
// Upstash Redis client (HTTP-based, edge-friendly). Returns null when the
// env vars are absent so local dev works without Redis — callers must handle
// the null case (caching simply becomes a no-op).
import { Redis } from "@upstash/redis";
import { env } from "./env";

export const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export const isRedisEnabled = redis !== null;
