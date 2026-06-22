// app/libs/prices.ts
// Server-side Finnhub quote helper with short Redis caching. Shared by the
// price route, portfolio P/L, and the seed script.
import { env } from "./env";
import { redis } from "./redis";

export interface Quote {
  current: number; // c
  change: number; // d
  percentChange: number; // dp
  high: number; // h
  low: number; // l
  open: number; // o
  previousClose: number; // pc
}

const TTL = 15;

export async function getQuote(symbol: string): Promise<Quote | null> {
  const sym = symbol.toUpperCase();
  const key = `quote:${sym}`;

  if (redis) {
    const cached = (await redis.get(key)) as any;
    if (cached) return normalize(cached);
  }

  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${env.FINNHUB_API_KEY}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (redis) await redis.set(key, data, { ex: TTL });
    return normalize(data);
  } catch {
    return null;
  }
}

function normalize(d: any): Quote {
  return {
    current: d.c ?? 0,
    change: d.d ?? 0,
    percentChange: d.dp ?? 0,
    high: d.h ?? 0,
    low: d.l ?? 0,
    open: d.o ?? 0,
    previousClose: d.pc ?? 0,
  };
}

/** Fetch many quotes in parallel, returned as a symbol→Quote map. */
export async function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const results = await Promise.all(unique.map(async (s) => [s, await getQuote(s)] as const));
  const map: Record<string, Quote> = {};
  for (const [s, q] of results) if (q) map[s] = q;
  return map;
}
