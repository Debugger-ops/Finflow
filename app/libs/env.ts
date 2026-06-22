// app/libs/env.ts
// Single, validated source of truth for environment variables.
// Fails fast at boot with a clear message instead of silently sending
// `token=undefined` to APIs or signing JWTs with an undefined secret.
import { z } from "zod";

const schema = z.object({
  // Core
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Auth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Market data (note: canonical name is FINNHUB_API_KEY)
  FINNHUB_API_KEY: z.string().min(1, "FINNHUB_API_KEY is required"),

  // Upstash Redis (rate limiting + caching) — optional so the app still
  // boots locally without them; features degrade gracefully when unset.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Stripe (card tokenization) — optional until you add keys.
  STRIPE_SECRET_KEY: z.string().optional(),

  // Cron auth — protects the scheduled-transfer worker endpoint.
  CRON_SECRET: z.string().optional(),
});

// Treat blank strings ("FOO=") as unset so optional vars validate correctly.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).map(([k, v]) => [k, v === "" ? undefined : v]),
);

const parsed = schema.safeParse(rawEnv);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
