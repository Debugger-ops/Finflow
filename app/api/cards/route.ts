// app/api/cards/route.ts — list the signed-in user's cards (safe fields only).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import { Card } from "../../models/Card";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const cards = await Card.find({ user: userId }).sort({ createdAt: -1 }).lean();

  const data = cards.map((c: any) => ({
    id: String(c._id),
    cardName: c.cardName,
    brand: c.brand,
    last4: c.last4,
    expMonth: c.expMonth,
    expYear: c.expYear,
    cardType: c.cardType,
    frozen: c.frozen,
    spendLimit: c.spendLimit,
    isDefault: c.isDefault,
  }));

  return NextResponse.json({ success: true, data });
}
