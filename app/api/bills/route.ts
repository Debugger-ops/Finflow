// app/api/bills/route.ts — list and create the signed-in user's bills.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import Bill from "../../models/Bill";
import { log } from "../../libs/logger";

const logger = log("bills");
const round2 = (n: number) => Math.round(n * 100) / 100;

const serialize = (b: any) => ({
  id: String(b._id),
  name: b.name,
  category: b.category,
  amount: b.amount,
  dueDate: new Date(b.dueDate).toISOString(),
  logo: b.logo,
  status: b.status,
  autopay: b.autopay,
  paidAt: b.paidAt ? new Date(b.paidAt).toISOString() : null,
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const bills = await Bill.find({ user: userId }).sort({ dueDate: 1 }).lean();
    const pending = bills.filter((b: any) => b.status === "pending");

    return NextResponse.json({
      success: true,
      data: {
        bills: bills.map(serialize),
        totals: {
          due: round2(pending.reduce((s: number, b: any) => s + b.amount, 0)),
          pendingCount: pending.length,
          paidCount: bills.length - pending.length,
        },
      },
    });
  } catch (err) {
    logger.error({ err }, "bill list failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json().catch(() => ({}));

    const amount = Number(body.amount);
    if (!body.name?.trim()) return NextResponse.json({ error: "Give the bill a name" }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter an amount greater than zero" }, { status: 400 });
    }
    const dueDate = new Date(body.dueDate);
    if (Number.isNaN(dueDate.getTime())) {
      return NextResponse.json({ error: "Enter a valid due date" }, { status: 400 });
    }

    const bill = await Bill.create({
      user: userId,
      name: String(body.name).trim(),
      category: String(body.category || "Utilities").trim(),
      amount: round2(amount),
      dueDate,
      logo: String(body.logo || "🧾").slice(0, 8),
      autopay: Boolean(body.autopay),
    });

    return NextResponse.json({ success: true, data: serialize(bill.toObject()) }, { status: 201 });
  } catch (err) {
    logger.error({ err }, "bill create failed");
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}
