// app/api/transactions/summary/route.ts
// Everything the dashboard needs to draw real numbers instead of the hardcoded
// demo figures: this month's income/expenses, a 6-month trend, the last 7 days
// of spend, and spend-by-category.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Types } from "mongoose";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import Transaction from "../../../models/Transaction";
import { log } from "../../../libs/logger";

const logger = log("transactions/summary");

const round2 = (n: number) => Math.round(n * 100) / 100;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function GET() {
  const session = await getServerSession(authOptions);
  const rawId = (session?.user as any)?.id;
  if (!rawId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const userId = new Types.ObjectId(String(rawId));

    // Window: start of the month 5 months back → covers the trend, this month
    // and the last 7 days in a single query.
    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const rows = await Transaction.find({
      status: "completed",
      createdAt: { $gte: windowStart },
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .select("sender recipient amount fee category createdAt")
      .lean();

    // 6-month buckets, oldest first.
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], income: 0, expenses: 0 };
    });
    const trendIndex = new Map(trend.map((t, i) => [t.key, i]));

    // Last 7 days, oldest first.
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return { key: d.toDateString(), day: DAYS[d.getDay()], amount: 0 };
    });
    const weekIndex = new Map(weekly.map((w, i) => [w.key, i]));

    const byCategory: Record<string, number> = {};
    const byCategoryPrev: Record<string, number> = {};
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let income = 0;
    let expenses = 0;

    for (const tx of rows as any[]) {
      const created = new Date(tx.createdAt);
      const isOutgoing = String(tx.sender) === String(userId);
      const value = isOutgoing ? tx.amount + (tx.fee ?? 0) : tx.amount;

      const ti = trendIndex.get(`${created.getFullYear()}-${created.getMonth()}`);
      if (ti !== undefined) {
        if (isOutgoing) trend[ti].expenses += value;
        else trend[ti].income += value;
      }

      if (created >= monthStart) {
        if (isOutgoing) {
          expenses += value;
          const cat = tx.category ?? "other";
          byCategory[cat] = (byCategory[cat] ?? 0) + value;
        } else {
          income += value;
        }
      } else if (isOutgoing && created >= prevMonthStart) {
        const cat = tx.category ?? "other";
        byCategoryPrev[cat] = (byCategoryPrev[cat] ?? 0) + value;
      }

      if (isOutgoing && created >= weekStart) {
        const wi = weekIndex.get(created.toDateString());
        if (wi !== undefined) weekly[wi].amount += value;
      }
    }

    const categoryTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);
    const categories = Object.entries(byCategory)
      .map(([category, amount]) => ({
        category,
        amount: round2(amount),
        percent: categoryTotal ? round2((amount / categoryTotal) * 100) : 0,
        // last month's spend in the same category — the dashboard uses it as the
        // comparison bar instead of an invented budget limit.
        previous: round2(byCategoryPrev[category] ?? 0),
      }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      success: true,
      data: {
        month: {
          income: round2(income),
          expenses: round2(expenses),
          net: round2(income - expenses),
          savingsRate: income > 0 ? round2(((income - expenses) / income) * 100) : 0,
        },
        trend: trend.map(({ month, income: i, expenses: e }) => ({
          month,
          income: round2(i),
          expenses: round2(e),
        })),
        weekly: weekly.map(({ day, amount }) => ({ day, amount: round2(amount) })),
        categories,
      },
    });
  } catch (err) {
    logger.error({ err }, "summary failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
