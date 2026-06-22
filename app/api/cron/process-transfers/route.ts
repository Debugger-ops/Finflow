// app/api/cron/process-transfers/route.ts
// Scheduled-transfer worker. Runs on a cron (see vercel.json). Picks up
// pending transfers whose scheduledAt has passed, executes them, and re-queues
// recurring ones for their next run.
//
// Secured with CRON_SECRET: requests must send `Authorization: Bearer <secret>`.
// Vercel Cron sends this automatically when CRON_SECRET is set.
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../libs/mongoConnect";
import Transaction from "../../../models/Transaction";
import User from "../../../models/User";
import { env } from "../../../libs/env";
import { log } from "../../../libs/logger";

const logger = log("cron/process-transfers");

export const dynamic = "force-dynamic";

function nextRunDate(from: Date, freq: "weekly" | "monthly"): Date {
  const d = new Date(from);
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET(req: NextRequest) {
  // Auth: reject unless the cron secret matches (when configured).
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  await connectDB();

  const due = await Transaction.find({
    status: "pending",
    scheduledAt: { $lte: new Date() },
  }).limit(100);

  let processed = 0;
  let failed = 0;

  for (const tx of due) {
    // Balance-guarded debit (atomic) — skip if sender lacks funds.
    const total = tx.amount + tx.fee;
    const debited = await User.findOneAndUpdate(
      { _id: tx.sender, balance: { $gte: total } },
      { $inc: { balance: -total } },
      { new: true },
    );

    if (!debited) {
      tx.status = "failed";
      await tx.save();
      failed++;
      continue;
    }

    if (tx.recipient) {
      await User.findByIdAndUpdate(tx.recipient, { $inc: { balance: tx.amount } });
    }

    tx.status = "completed";
    tx.processedAt = new Date();
    await tx.save();
    processed++;

    // Re-queue the next occurrence for recurring transfers.
    if (tx.isRecurring && tx.recurringFrequency && tx.scheduledAt) {
      await Transaction.create({
        sender: tx.sender,
        recipient: tx.recipient,
        recipientEmail: tx.recipientEmail,
        amount: tx.amount,
        fee: tx.fee,
        currency: tx.currency,
        note: tx.note,
        paymentMethod: tx.paymentMethod,
        status: "pending",
        scheduledAt: nextRunDate(tx.scheduledAt, tx.recurringFrequency),
        isRecurring: true,
        recurringFrequency: tx.recurringFrequency,
      });
    }
  }

  logger.info({ processed, failed, found: due.length }, "cron run complete");
  return NextResponse.json({ processed, failed, found: due.length });
}
