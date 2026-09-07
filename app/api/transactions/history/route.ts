// app/api/transactions/history/route.ts
// GET paginated transaction history for the signed-in user (Mongoose).
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import Transaction from "../../../models/Transaction";
import { log } from "../../../libs/logger";

const logger = log("transactions/history");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const type = searchParams.get("type") ?? "all";
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "all";
  const range = searchParams.get("range") ?? "all";
  const status = searchParams.get("status") ?? "all";
  const format = searchParams.get("format") ?? "json";

  // Base filter: transactions where the user is sender or recipient.
  const filter: Record<string, any> = { $or: [{ sender: userId }, { recipient: userId }] };
  if (type === "sent") { delete filter.$or; filter.sender = userId; }
  if (type === "received") { delete filter.$or; filter.recipient = userId; }
  if (category !== "all") filter.category = category;
  if (status !== "all") filter.status = status;

  // Search matches the counterparty address or the note. It is combined with
  // the ownership clause via $and so neither one can be dropped.
  if (search) {
    const rx = { $regex: escapeRegex(search), $options: "i" };
    const own = filter.$or ?? [filter.sender ? { sender: userId } : { recipient: userId }];
    delete filter.$or;
    filter.$and = [{ $or: own }, { $or: [{ recipientEmail: rx }, { note: rx }] }];
  }

  const since = rangeStart(range);
  if (since) filter.createdAt = { $gte: since };

  try {
    await connectDB();

    // A CSV export covers the whole filtered set, not just the current page.
    const exporting = format === "csv";

    const [total, rows] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate("sender", "name email")
        .populate("recipient", "name email")
        .sort({ createdAt: -1 })
        .skip(exporting ? 0 : (page - 1) * limit)
        .limit(exporting ? 5000 : limit)
        .lean(),
    ]);

    const transactions = rows.map((tx: any) => {
      const isSender = String(tx.sender?._id ?? tx.sender) === String(userId);
      const counterpartyName = isSender
        ? tx.recipient?.name ?? tx.recipientEmail
        : tx.sender?.name ?? tx.sender?.email;

      return {
        id: String(tx._id),
        recipient: counterpartyName,
        recipientAvatar: (counterpartyName ?? "??").slice(0, 2).toUpperCase(),
        amount: tx.amount,
        currency: tx.currency,
        date: new Date(tx.createdAt).toISOString(),
        status: tx.status,
        type: isSender ? "sent" : "received",
        category: tx.category ?? "other",
        note: tx.note ?? undefined,
        paymentMethod: tx.paymentMethod,
      };
    });

    if (format === "csv") {
      const header = "Date,Counterparty,Type,Category,Amount,Currency,Status,Method,Note";
      const body = transactions
        .map((t) =>
          [
            new Date(t.date).toISOString().slice(0, 10),
            csvCell(t.recipient ?? ""),
            t.type,
            t.category,
            (t.type === "sent" ? -t.amount : t.amount).toFixed(2),
            t.currency,
            t.status,
            t.paymentMethod,
            csvCell(t.note ?? ""),
          ].join(","),
        )
        .join("\n");

      return new NextResponse(`${header}\n${body}\n`, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="finflow-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    logger.error({ err }, "history failed");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/** Escape user input before it reaches a $regex so it can't alter the query. */
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Start date for the supported relative ranges. */
function rangeStart(range: string): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now); d.setHours(0, 0, 0, 0); return d;
    }
    case "week": {
      const d = new Date(now); d.setDate(d.getDate() - 7); return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}

/** Quote a CSV cell that may contain commas, quotes or newlines. */
function csvCell(value: string): string {
  const v = String(value);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
