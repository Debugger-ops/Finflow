// app/libs/transfer.ts
// Core money-movement logic shared by the send route and the scheduled-transfer
// worker. Uses a balance-guarded atomic update so two concurrent transfers can
// never overdraw an account (works on standalone MongoDB without replica-set
// transactions).
import User from "../models/User";
import Transaction, { Currency, PaymentMethod, RecurringFrequency } from "../models/Transaction";

const FEES: Record<PaymentMethod, number> = { bank: 0, card: 0.5, wallet: 0 };
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface TransferInput {
  senderId: string;
  recipientEmail: string;
  amount: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  note?: string | null;
  scheduleDate?: string | null;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency | null;
}

// Flat shape (optional fields) — see note in validate.ts re: strict:false.
export interface TransferResult {
  ok: boolean;
  transactionId?: string;
  status?: "completed" | "pending";
  httpStatus?: number;
  message?: string;
}

/** Execute (or schedule) a transfer. */
export async function executeTransfer(input: TransferInput): Promise<TransferResult> {
  const {
    senderId,
    recipientEmail,
    amount,
    currency = "USD",
    paymentMethod = "bank",
    note,
    scheduleDate,
    isRecurring = false,
    recurringFrequency,
  } = input;

  const fee = round2(FEES[paymentMethod] ?? 0);
  const amt = round2(amount);
  const total = round2(amt + fee);
  const email = recipientEmail.toLowerCase().trim();

  const sender = await User.findById(senderId);
  if (!sender) return { ok: false, httpStatus: 400, message: "Sender account not found." };
  if (sender.email.toLowerCase() === email) {
    return { ok: false, httpStatus: 400, message: "You cannot send money to yourself." };
  }

  // Defer future-dated transfers to the cron worker.
  const isScheduled = Boolean(scheduleDate) && new Date(scheduleDate as string) > new Date();
  if (isScheduled) {
    const recipient = await User.findOne({ email });
    const tx = await Transaction.create({
      sender: senderId,
      recipient: recipient?._id ?? null,
      recipientEmail: email,
      amount: amt,
      fee,
      currency,
      note: note?.trim() || null,
      paymentMethod,
      status: "pending",
      scheduledAt: new Date(scheduleDate as string),
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency ?? null : null,
    });
    return { ok: true, transactionId: tx.id, status: "pending" };
  }

  // Atomic, balance-guarded debit: only succeeds if balance >= total.
  const debited = await User.findOneAndUpdate(
    { _id: senderId, balance: { $gte: total } },
    { $inc: { balance: -total } },
    { new: true },
  );
  if (!debited) {
    return { ok: false, httpStatus: 400, message: "Insufficient balance (including fees)." };
  }

  const recipient = await User.findOneAndUpdate(
    { email },
    { $inc: { balance: amt } },
    { new: true },
  );

  const tx = await Transaction.create({
    sender: senderId,
    recipient: recipient?._id ?? null,
    recipientEmail: email,
    amount: amt,
    fee,
    currency,
    note: note?.trim() || null,
    paymentMethod,
    status: "completed",
    processedAt: new Date(),
    isRecurring,
    recurringFrequency: isRecurring ? recurringFrequency ?? null : null,
  });

  return { ok: true, transactionId: tx.id, status: "completed" };
}
