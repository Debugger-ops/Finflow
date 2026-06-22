import { NextRequest, NextResponse } from "next/server";
import { env } from "../../../libs/env";
import { redis } from "../../../libs/redis";
import { enforce, limiters, clientIp } from "../../../libs/ratelimit";

export const dynamic = "force-dynamic";

const CACHE_TTL_SECONDS = 15; // Finnhub free tier rate-limits hard; cache quotes briefly.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const limited = await enforce(limiters.read, `prices:${clientIp(request)}`);
  if (limited) return limited;

  const key = `quote:${symbol.toUpperCase()}`;

  // Serve from cache when available.
  if (redis) {
    const cached = await redis.get(key);
    if (cached) return NextResponse.json(cached);
  }

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${env.FINNHUB_API_KEY}`,
    );
    if (!res.ok) throw new Error("Finnhub API responded with an error");

    const data = await res.json();
    if (redis) await redis.set(key, data, { ex: CACHE_TTL_SECONDS });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to fetch price" }, { status: 500 });
  }
}
