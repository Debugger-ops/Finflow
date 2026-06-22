// app/api/payments/route.ts — bill pay / merchant payment.
// Debits the user's balance (balance-guarded) and records a categorized
// transaction. Reuses the same atomic pattern as transfers.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import User from "../../models/User";
import Transaction from "../../models/Transaction";
import { enforce, limiters, clientIp } from "../../libs/ratelimit";
import { log } from "../../libs/logger";
import { z } from "zod";

const logger = log("payments");

const schema = z.object({
  payee: z.string().min(1).max(120),
  amount: z.coerce.number().positive(),
  category: z.enum(["bills", "shopping", "food", "transport", "entertainment", "other"]).default("bills"),
  note: z.string().max(280).optional(),
  paymentMethod: z.enum(["bank", "card", "wallet"]).default("bank"),
});

export async function POST(req: NextRequest) {
  const limited = await enforce(limiters.money, `pay:${clientIp(req)}`);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { payee, amount, category, note, paymentMethod } = parsed.data;
  const amt = Math.round(amount * 100) / 100;

  try {
    await connectDB();

    const debited = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amt } },
      { $inc: { balance: -amt } },
      { new: true },
    );
    if (!debited) return NextResponse.json({ message: "Insufficient balance." }, { status: 400 });

    const tx = await Transaction.create({
      sender: userId,
      recipient: null,
      recipientEmail: payee,
      amount: amt,
      fee: 0,
      currency: "USD",
      note: note ?? null,
      paymentMethod,
      category,
      status: "completed",
      processedAt: new Date(),
    });

    return NextResponse.json({ message: "Payment sent.", transactionId: tx.id });
  } catch (err) {
    logger.error({ err }, "payment failed");
    return NextResponse.json({ message: "Payment failed." }, { status: 500 });
  }
}
