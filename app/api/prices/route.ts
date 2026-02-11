import { NextResponse } from "next/server";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

if (!FINNHUB_API_KEY) {
  throw new Error("Missing FINNHUB_API_KEY in environment variables");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbols = searchParams.get("symbols");

  if (!symbols) {
    return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
  }

  const symbolList = symbols.split(",");

  const data: Record<string, { price: number; change: number; changePercent: number }> = {};

  await Promise.all(
    symbolList.map(async (symbol) => {
      try {
        // Finnhub quote endpoint
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${FINNHUB_API_KEY}`
        );

        if (!res.ok) {
          console.error(`Finnhub failed for ${symbol}:`, res.statusText);
          return;
        }

        const json = await res.json();

        /**
         * Finnhub quote response:
         * c: current price
         * d: change
         * dp: change% (percent)
         * h, l: hi/lo of day
         */
        data[symbol.toUpperCase()] = {
          price: json.c ?? 0,
          change: json.d ?? 0,
          changePercent: json.dp ?? 0,
        };
      } catch (err) {
        console.error("Error fetching Finnhub:", err);
      }
    })
  );

  return NextResponse.json(data);
}
