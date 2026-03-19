import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { prisma } from "../../../libs/db";

type DbTransactionRow = {
  id: string;
  senderId: string;
  recipientId: string | null;
  recipientEmail: string;
  amount: { toString(): string };
  currency: string;
  status: string;
  paymentMethod: string;
  note: string | null;
  createdAt: Date;
  sender: { name: string | null; email: string };
  recipient: { name: string | null; email: string } | null;
};

type WhereInput = {
  OR?: Array<{ senderId?: string; recipientId?: string }>;
  senderId?: string;
  recipientId?: string;
  recipientEmail?: { contains: string; mode: "insensitive" };
};

function formatTx(tx: DbTransactionRow, currentUserId: string) {
  const isSender = tx.senderId === currentUserId;
  const counterparty = isSender ? tx.recipient : tx.sender;
  const recipientName = isSender
    ? counterparty?.name ?? tx.recipientEmail
    : tx.sender.name ?? tx.sender.email;

  return {
    id:              tx.id,
    recipient:       recipientName,
    recipientAvatar: (recipientName ?? "??").slice(0, 2).toUpperCase(),
    amount:          Number(tx.amount.toString()),
    currency:        tx.currency,
    date:            tx.createdAt.toISOString(),
    status:          tx.status.toLowerCase() as "completed" | "pending" | "failed",
    type:            (isSender ? "sent" : "received") as "sent" | "received",
    note:            tx.note ?? undefined,
    paymentMethod:   tx.paymentMethod.toLowerCase() as "bank" | "card" | "wallet",
  };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const { searchParams } = new URL(req.url);
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const type   = searchParams.get("type")   ?? "all";
  const search = searchParams.get("search") ?? "";

  const baseWhere: WhereInput = {
    OR: [{ senderId: userId }, { recipientId: userId }],
  };

  if (type === "sent")     { delete baseWhere.OR; baseWhere.senderId    = userId; }
  if (type === "received") { delete baseWhere.OR; baseWhere.recipientId = userId; }
  if (search) {
    baseWhere.recipientEmail = { contains: search, mode: "insensitive" };
  }

  try {
    const [total, rows] = await (prisma as any).$transaction([
      (prisma as any).transaction.count({ where: baseWhere }),
      (prisma as any).transaction.findMany({
        where:   baseWhere,
        include: {
          sender:    { select: { name: true, email: true } },
          recipient: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
    ]) as [number, DbTransactionRow[]];

    return NextResponse.json({
      transactions: rows.map((tx) => formatTx(tx, userId)),
      pagination:   { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[GET /api/transactions/history]", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}