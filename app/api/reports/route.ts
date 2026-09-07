// app/api/reports/route.ts
// One request powers the whole Reports screen: monthly income/expense/savings
// series, category breakdown with month-over-month movement, top counterparties,
// weekly totals, daily cashflow and the savings-rate history.
//
// ?period=3m|6m|1y (default 6m)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { Types } from "mongoose";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import Transaction from "../../models/Transaction";
import { log } from "../../libs/logger";

const logger = log("reports");

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const round2 = (n: number) => Math.round(n * 100) / 100;

const PERIOD_MONTHS: Record<string, number> = { "3m": 3, "6m": 6, "1y": 12 };

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const rawId = (session?.user as any)?.id;
  if (!rawId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = new URL(req.url).searchParams.get("period") ?? "6m";
  const months = PERIOD_MONTHS[period] ?? 6;

  try {
    await connectDB();
    const userId = new Types.ObjectId(String(rawId));

    const now = new Date();
    const windowStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const rows = await Transaction.find({
      status: "completed",
      createdAt: { $gte: windowStart },
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .select("sender recipient recipientEmail amount fee category createdAt")
      .populate("recipient", "name email")
      .lean();

    // ── Monthly buckets ──────────────────────────────────────────────────
    const monthly = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, month: MONTHS[d.getMonth()], income: 0, expenses: 0 };
    });
    const monthIndex = new Map(monthly.map((m, i) => [m.key, i]));

    // ── Weekly buckets (last 4 weeks) ────────────────────────────────────
    const weekly = Array.from({ length: 4 }, (_, i) => ({ week: `W${i + 1}`, amount: 0 }));
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 27);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    // ── Daily cashflow for the current month ─────────────────────────────
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const cashflow = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, flow: 0 }));

    const byCategory: Record<string, number> = {};
    const byCategoryPrev: Record<string, number> = {};
    const merchants: Record<string, { amount: number; count: number }> = {};

    for (const tx of rows as any[]) {
      const created = new Date(tx.createdAt);
      const isOutgoing = String(tx.sender) === String(userId);
      const value = isOutgoing ? tx.amount + (tx.fee ?? 0) : tx.amount;

      const mi = monthIndex.get(`${created.getFullYear()}-${created.getMonth()}`);
      if (mi !== undefined) {
        if (isOutgoing) monthly[mi].expenses += value;
        else monthly[mi].income += value;
      }

      if (isOutgoing) {
        if (created >= monthStart) {
          byCategory[tx.category ?? "other"] = (byCategory[tx.category ?? "other"] ?? 0) + value;
        } else if (created >= prevMonthStart) {
          byCategoryPrev[tx.category ?? "other"] = (byCategoryPrev[tx.category ?? "other"] ?? 0) + value;
        }

        if (created >= fourWeeksAgo) {
          const wi = Math.min(3, Math.floor((created.getTime() - fourWeeksAgo.getTime()) / (7 * 86400000)));
          weekly[wi].amount += value;
        }

        // Counterparty rollup — the display name if the recipient is a FinFlow
        // user, otherwise the address the money was sent to.
        const label = tx.recipient?.name || tx.recipientEmail || "Unknown";
        merchants[label] ??= { amount: 0, count: 0 };
        merchants[label].amount += value;
        merchants[label].count += 1;
      }

      if (created >= monthStart && created.getMonth() === now.getMonth()) {
        const d = created.getDate() - 1;
        if (cashflow[d]) cashflow[d].flow += isOutgoing ? -value : value;
      }
    }

    const series = monthly.map(({ month, income, expenses }) => ({
      month,
      income: round2(income),
      expenses: round2(expenses),
      savings: round2(income - expenses),
      net: round2(income - expenses),
    }));

    const savingsHistory = monthly.map(({ month, income, expenses }) => ({
      month,
      rate: income > 0 ? round2(((income - expenses) / income) * 100) : 0,
    }));

    const categoryTotal = Object.values(byCategory).reduce((a, b) => a + b, 0);
    const categories = Object.entries(byCategory)
      .map(([category, amount]) => {
        const previous = byCategoryPrev[category] ?? 0;
        return {
          category,
          amount: round2(amount),
          previous: round2(previous),
          // Percent of last month's spend in the same category (100 = level).
          pct: previous > 0 ? Math.round((amount / previous) * 100) : 0,
          share: categoryTotal ? round2((amount / categoryTotal) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const topMerchants = Object.entries(merchants)
      .map(([name, v]) => ({ name, amount: round2(v.amount), count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const totalIncome = series.reduce((s, m) => s + m.income, 0);
    const totalExpenses = series.reduce((s, m) => s + m.expenses, 0);
    const rated = savingsHistory.filter((_, i) => series[i].income > 0);
    const avgSavingsRate = rated.length
      ? round2(rated.reduce((s, m) => s + m.rate, 0) / rated.length)
      : 0;

    // Change vs. the immediately preceding month, for the KPI badges.
    const cur = series[series.length - 1];
    const prev = series.length > 1 ? series[series.length - 2] : null;
    const change = (a: number, b: number) => (b > 0 ? round2(((a - b) / b) * 100) : 0);

    return NextResponse.json({
      success: true,
      data: {
        period,
        totals: {
          income: round2(totalIncome),
          expenses: round2(totalExpenses),
          savings: round2(totalIncome - totalExpenses),
          avgSavingsRate,
          incomeChange:   prev ? change(cur.income, prev.income) : 0,
          expensesChange: prev ? change(cur.expenses, prev.expenses) : 0,
          savingsChange:  prev ? change(cur.savings, prev.savings) : 0,
          rateChange: prev
            ? round2((savingsHistory[savingsHistory.length - 1].rate) - savingsHistory[savingsHistory.length - 2].rate)
            : 0,
        },
        series,
        savingsHistory,
        categories,
        topMerchants,
        weekly: weekly.map(w => ({ ...w, amount: round2(w.amount) })),
        cashflow: cashflow.map(c => ({ ...c, flow: round2(c.flow) })),
      },
    });
  } catch (err) {
    logger.error({ err }, "report build failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
