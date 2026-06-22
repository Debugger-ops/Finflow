// app/api/transactions/statements/route.ts
// Monthly statement summaries: money in vs out per month for the signed-in user.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import Transaction from "../../../models/Transaction";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const rows = await Transaction.find({
    $or: [{ sender: userId }, { recipient: userId }],
    status: "completed",
  })
    .select("sender amount fee createdAt")
    .lean();

  // Bucket by YYYY-MM.
  const months: Record<string, { moneyIn: number; moneyOut: number; count: number }> = {};
  for (const tx of rows as any[]) {
    const d = new Date(tx.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] ??= { moneyIn: 0, moneyOut: 0, count: 0 };
    const isSender = String(tx.sender) === String(userId);
    if (isSender) months[key].moneyOut += tx.amount + (tx.fee ?? 0);
    else months[key].moneyIn += tx.amount;
    months[key].count++;
  }

  const statements = Object.entries(months)
    .map(([month, v]) => ({
      month,
      moneyIn: round2(v.moneyIn),
      moneyOut: round2(v.moneyOut),
      net: round2(v.moneyIn - v.moneyOut),
      count: v.count,
    }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return NextResponse.json({ success: true, data: statements });
}

const round2 = (n: number) => Math.round(n * 100) / 100;
