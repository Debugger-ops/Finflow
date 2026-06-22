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

  // Base filter: transactions where the user is sender or recipient.
  const filter: Record<string, any> = { $or: [{ sender: userId }, { recipient: userId }] };
  if (type === "sent") delete filter.$or, (filter.sender = userId);
  if (type === "received") delete filter.$or, (filter.recipient = userId);
  if (search) filter.recipientEmail = { $regex: search, $options: "i" };

  try {
    await connectDB();

    const [total, rows] = await Promise.all([
      Transaction.countDocuments(filter),
      Transaction.find(filter)
        .populate("sender", "name email")
        .populate("recipient", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
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
        note: tx.note ?? undefined,
        paymentMethod: tx.paymentMethod,
      };
    });

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    logger.error({ err }, "history failed");
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
