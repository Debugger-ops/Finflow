// app/api/portfolio/route.ts
// Returns the signed-in user's real holdings with live P/L computed from
// Finnhub quotes, plus totals and allocation breakdown.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import Holding from "../../models/Holding";
import { getQuotes } from "../../libs/prices";
import { log } from "../../libs/logger";

const logger = log("portfolio");

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const holdings = await Holding.find({ userId }).lean();

    if (holdings.length === 0) {
      return NextResponse.json({
        success: true,
        data: { positions: [], totals: { marketValue: 0, costBasis: 0, totalPL: 0, totalPLPercent: 0, dayPL: 0 }, allocation: [] },
      });
    }

    const quotes = await getQuotes(holdings.map((h: any) => h.symbol));

    let marketValue = 0;
    let costBasis = 0;
    let dayPL = 0;

    const positions = holdings.map((h: any) => {
      const q = quotes[h.symbol];
      const price = q?.current ?? h.avgCost; // fall back to cost if quote unavailable
      const value = price * h.shares;
      const cost = h.avgCost * h.shares;
      const pl = value - cost;
      const dayChange = (q?.change ?? 0) * h.shares;

      marketValue += value;
      costBasis += cost;
      dayPL += dayChange;

      return {
        symbol: h.symbol,
        name: h.name,
        assetType: h.assetType,
        shares: h.shares,
        avgCost: round2(h.avgCost),
        price: round2(price),
        marketValue: round2(value),
        costBasis: round2(cost),
        unrealizedPL: round2(pl),
        unrealizedPLPercent: cost ? round2((pl / cost) * 100) : 0,
        dayChangePercent: round2(q?.percentChange ?? 0),
      };
    });

    const totalPL = marketValue - costBasis;
    const allocation = positions
      .map((p) => ({ symbol: p.symbol, percent: marketValue ? round2((p.marketValue / marketValue) * 100) : 0 }))
      .sort((a, b) => b.percent - a.percent);

    return NextResponse.json({
      success: true,
      data: {
        positions,
        totals: {
          marketValue: round2(marketValue),
          costBasis: round2(costBasis),
          totalPL: round2(totalPL),
          totalPLPercent: costBasis ? round2((totalPL / costBasis) * 100) : 0,
          dayPL: round2(dayPL),
        },
        allocation,
      },
    });
  } catch (err) {
    logger.error({ err }, "portfolio fetch failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
