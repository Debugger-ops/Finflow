# FinFlow — Backend hardening & UI cleanup

This change set fixes the critical backend flaws, removes redundant tooling, adds
production-grade infrastructure, and replaces the broken CSS setup with a shared
design system.

## 1. Critical fixes

| Issue | Before | After |
|-------|--------|-------|
| Card security | `cvv` + full card number stored in plaintext (PCI-DSS violation) | Cards tokenized by Stripe; we store only `paymentMethodId`, `brand`, `last4`, expiry |
| Broken transfers | `transactions/send` + `history` called Prisma models that **did not exist** (empty schema), all cast to `any` | Rewritten on Mongoose with an atomic, balance-guarded debit |
| DB connection bug | `await connectDB` (missing `()`) in order routes — never awaited | `await connectDB()`, with a cached connection |
| Fake balance | `user/balance` returned a fake `$500` when balance was 0 | Returns the real balance |
| Env mismatch | code read `FINNHUB_KEY`, `.env` had `FINNHUB_API_KEY` | One validated env module; canonical `FINNHUB_API_KEY` |
| Identity drift | order routes used `session.user.email` as the user id | all routes use `session.user.id` |
| Two auth configs | duplicate `authOptions` (one mixing NextAuth v5 API into a v4 app) | single source in `app/libs/auth.ts` |

## 2. Removed (redundant / dead)

- **Prisma** (`prisma`, `@prisma/client`, `prisma.config.ts`, `prisma/`) — schema was empty and unused; Mongoose is the real ORM.
- **`mongodb` driver** (v3.7.4, 2019) — never imported; Mongoose bundles its own.
- **Custom JWT** (`app/libs/jwt.ts`, `jsonwebtoken`, `@types/jsonwebtoken`) — unused; NextAuth handles sessions.
- **`@types/next-auth@3`** — wrong major version; v4 ships its own types.
- **Empty `app/libs/prisma.ts`, `app/libs/db.ts`**, and committed **`.DS_Store`** files.

## 3. Added technologies

- **Validated env** — `app/libs/env.ts` (zod). App fails fast with a clear message if a required var is missing.
- **Zod validation** on every write route via `app/libs/validate.ts` + `app/libs/validators/`.
- **Structured logging** — `app/libs/logger.ts` (pino), with secret/PII redaction.
- **Rate limiting** — `app/libs/ratelimit.ts` (Upstash sliding window) on auth, transfers, orders, price reads. No-ops without Redis.
- **Redis caching** — `app/libs/redis.ts`; Finnhub quotes cached 15s.
- **Stripe** — `app/libs/stripe.ts` + tokenized `Card` model.
- **Scheduled / recurring transfers** — `app/api/cron/process-transfers` + `vercel.json` cron (every 15 min); shared logic in `app/libs/transfer.ts`.
- **Tests** — Vitest (`tests/`), 9 passing.
- **CI** — `.github/workflows/ci.yml` runs lint + typecheck + tests on push/PR.

## 4. CSS / UI

- `globals.css` previously declared `@tailwind` directives **but Tailwind was never installed**, and defined a *light* theme while every page used its own *dark* `:root`. Removed the dead directives.
- New **`app/styles/theme.css`** — one canonical token set (surfaces, text, brand, semantic colors, radius, spacing, shadows, motion) plus reusable `.btn` / `.card` / `.input` / `.badge` primitives.
- Fonts now load **once** via `next/font` in `app/layout.tsx` (removed the render-blocking Google Fonts `@import` duplicated across 8 page CSS files).
- Added themed scrollbars, accessible `:focus-visible` rings, text selection color, and a global `prefers-reduced-motion` guard.

### Migrating a page to the shared system
Delete that page's local `:root { … }` block — it will inherit the shared tokens
from `theme.css`. The variable names already match, so pages render unchanged
while converging on one source of truth.

## 5. Run it

```bash
npm install
cp .env.example .env.local   # then fill in values (NEXTAUTH_SECRET etc.)
npm run dev
npm test
npm run typecheck
```

Optional features (Upstash, Stripe, cron) activate automatically once you add
their keys to `.env.local`; without them the app still runs.

## 6. Still worth doing (not in this pass)

- Add a Stripe Elements form on the client for `cards/add` (sends `paymentMethodId`).
- Add Sentry for error monitoring (logger is ready to feed it).
- Migrate each page's `:root` onto the shared tokens and delete the duplicates.
- Move `app/models/props.ts` and `app/models/dash.ts` into a `types/` folder.

---

# Part 2 — Settings fix + fintech feature build

## Why settings didn't work
Settings were split across three inconsistent stores (`Profile` model, `Settings`
model, and `User.profile`). The privacy fields weren't even in the `Profile`
schema, so Mongoose **silently dropped them** on save. Several routes never
called `connectDB()`, and the GET handlers returned **404** when nothing was
saved yet — so the UI always fell back to its hardcoded defaults.

### Fix
- New single **`UserSettings`** model holds notifications, privacy, appearance,
  currency and 2FA — one document per user, with sane defaults.
- `notifications` / `privacy` / `appearance` routes rewritten to upsert and
  **always return 200 with real values** (defaults on first load, never 404).
- `connectDB()` added to `password`, `export`, `sessions`, `activity`.
- The existing profile UI now persists correctly — no frontend changes needed.

## New fintech features (backend + endpoints)

**Investing** — `Holding` + `Watchlist` models; `app/libs/trade.ts` moves cash,
updates positions with weighted-average cost basis, and records orders.
`GET /api/portfolio` returns positions with **live P/L** from Finnhub, totals,
and allocation. Buy/sell routes now actually debit/credit balance and holdings.

**Cards & payments** — `Card` extended with `frozen`, `spendLimit`, `cardType`,
`isDefault`. `GET /api/cards`, `PATCH/DELETE /api/cards/[id]` (freeze, limit,
default, remove). `POST /api/payments` for bill pay (balance-guarded, categorized).

**Security** — TOTP 2FA implemented from scratch in `app/libs/totp.ts` (RFC 6238,
no dependency; works with Google Authenticator/Authy). `GET/POST /api/profile/2fa`
(enroll → verify → disable). Secret stored `select:false`.

**Money & ledger** — transactions now carry a `category`; `GET /api/transactions/statements`
(money in/out per month) and `GET /api/transactions/insights` (spending by
category, current month).

## Seed realistic demo data
```bash
npm run seed                      # default demo@finflow.app / Demo@1234
npm run seed your@email.com       # seed a specific account
```
Creates a demo user with an $8,450 balance, 5 holdings (+ matching orders),
12 categorized transactions plus an upcoming recurring transfer, 2 cards,
activity log, active sessions, and settings. Idempotent — safe to re-run.
The script is self-contained (`scripts/seed.mjs`) and needs no build step.

## New endpoints summary
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/portfolio` | Holdings with live P/L |
| GET | `/api/cards` | List cards |
| PATCH/DELETE | `/api/cards/[id]` | Freeze / limit / default / remove |
| POST | `/api/payments` | Bill pay / merchant payment |
| GET/POST | `/api/profile/2fa` | 2FA status / enroll / verify / disable |
| GET | `/api/transactions/statements` | Monthly in/out |
| GET | `/api/transactions/insights` | Spending by category |

All changes typecheck clean (0 errors project-wide, including the previously
broken legacy routes) and tests pass (13).
