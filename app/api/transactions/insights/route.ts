// app/api/transactions/insights/route.ts
// Spending-by-category for the current month (outgoing transactions only).
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

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const rows = await Transaction.find({
    sender: userId,
    status: "completed",
    createdAt: { $gte: start },
  })
    .select("amount fee category")
    .lean();

  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const tx of rows as any[]) {
    const spent = tx.amount + (tx.fee ?? 0);
    byCategory[tx.category ?? "other"] = (byCategory[tx.category ?? "other"] ?? 0) + spent;
    total += spent;
  }

  const categories = Object.entries(byCategory)
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percent: total ? round2((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ success: true, data: { total: round2(total), categories } });
}

const round2 = (n: number) => Math.round(n * 100) / 100;
