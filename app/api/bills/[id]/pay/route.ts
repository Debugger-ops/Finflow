// app/api/bills/[id]/pay/route.ts
// Paying a bill actually moves money: a balance-guarded atomic debit, a real
// Transaction row (category "bills") so it shows up in history and reports, and
// a notification. The old screen only ran a setTimeout and flipped a flag.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "../../../../libs/auth";
import { connectDB } from "../../../../libs/mongoConnect";
import Bill from "../../../../models/Bill";
import User from "../../../../models/User";
import Transaction from "../../../../models/Transaction";
import { Notification } from "../../../../models/Notification";
import { enforce, limiters, clientIp } from "../../../../libs/ratelimit";
import { log } from "../../../../libs/logger";

const logger = log("bills/pay");
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const limited = await enforce(limiters.money, `bill:${clientIp(req)}`);
  if (limited) return limited;

  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
  }

  try {
    await connectDB();

    // Claim the bill first: the status guard makes a double-submit a no-op
    // rather than a double charge.
    const bill = await Bill.findOneAndUpdate(
      { _id: id, user: userId, status: "pending" },
      { $set: { status: "paid", paidAt: new Date() } },
      { new: true },
    );
    if (!bill) {
      return NextResponse.json({ error: "Bill not found or already paid" }, { status: 404 });
    }

    const amount = round2(bill.amount);

    // Balance-guarded debit — cannot overdraw, even with concurrent requests.
    const debited = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    );
    if (!debited) {
      // Put the bill back the way we found it.
      await Bill.updateOne({ _id: bill._id }, { $set: { status: "pending", paidAt: null } });
      return NextResponse.json({ error: "Insufficient balance to pay this bill" }, { status: 400 });
    }

    let tx;
    try {
      tx = await Transaction.create({
        sender: userId,
        recipient: null,
        recipientEmail: `${bill.name.toLowerCase().replace(/\s+/g, "-")}@bill.finflow`,
        amount,
        fee: 0,
        currency: "USD",
        note: `${bill.name} — ${bill.category}`,
        paymentMethod: "bank",
        category: "bills",
        status: "completed",
        processedAt: new Date(),
      });
      await Bill.updateOne({ _id: bill._id }, { $set: { lastTransaction: tx._id } });
    } catch (err) {
      // Roll the money and the bill back if the ledger write fails.
      await User.updateOne({ _id: userId }, { $inc: { balance: amount } });
      await Bill.updateOne({ _id: bill._id }, { $set: { status: "pending", paidAt: null } });
      throw err;
    }

    await Notification.create({
      user: userId,
      title: `${bill.name} paid`,
      body: `$${amount.toFixed(2)} sent. New balance $${debited.balance.toFixed(2)}.`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        billId: String(bill._id),
        transactionId: String(tx._id),
        amount,
        balance: round2(debited.balance),
      },
    });
  } catch (err) {
    logger.error({ err }, "bill payment failed");
    return NextResponse.json({ error: "Payment failed. Please try again." }, { status: 500 });
  }
}
