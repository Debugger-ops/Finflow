import { NextResponse } from "next/server";

export async function GET({ params }: { params: { symbol: string } }) {
  const symbol = params.symbol.toUpperCase();
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_KEY}`);
  const data = await res.json();
  return NextResponse.json(data);
}
