// app/libs/logger.ts
// Structured logging with pino (already a dependency). Replaces ad-hoc
// console.* calls so logs are queryable JSON in production and pretty in dev.
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { app: "finflow" },
  redact: {
    // Never log secrets / PII even if accidentally passed in.
    paths: ["password", "*.password", "cvv", "*.cvv", "cardNumber", "*.cardNumber", "token", "*.token"],
    censor: "[redacted]",
  },
});

/** Child logger scoped to a route or module. */
export const log = (scope: string) => logger.child({ scope });
