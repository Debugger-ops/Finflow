/**
 * app/api/transactions/send/route.ts
 *
 * POST /api/transactions/send
 * Validates input, deducts sender balance, credits recipient (if registered),
 * and records the transaction atomically.
 *
 * Request body (JSON):
 * {
 *   recipientEmail:    string      – required
 *   amount:            number      – required, > 0
 *   currency:          Currency    – default "USD"
 *   paymentMethod:     "bank" | "card" | "wallet"  – default "bank"
 *   note?:             string
 *   scheduleDate?:     string      – ISO date string; null = immediate
 *   isRecurring:       boolean
 *   recurringFrequency?: "weekly" | "monthly" | null
 * }
 *
 * Response 200: { message: string; transactionId: string }
 * Response 400: { message: string }
 * Response 401: { message: string }
 * Response 500: { message: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { prisma } from "../../../libs/db";

// ── Local string-literal types (stay in sync with prisma/schema.prisma enums) ─
// Using plain strings avoids the "@prisma/client has no exported member" error
// that occurs before `npx prisma generate` has been run.
type Currency       = "USD" | "EUR" | "GBP" | "INR" | "AED";
type DbPaymentMethod = "BANK" | "CARD" | "WALLET";
type DbRecurringFreq = "WEEKLY" | "MONTHLY";
type DbStatus        = "PENDING" | "COMPLETED" | "FAILED";

// ── Fee table (mirrors the frontend PAYMENT_METHODS constant) ─────────────────
const FEES: Record<string, number> = {
  bank:   0,
  card:   0.50,
  wallet: 0,
};

const VALID_CURRENCIES: Currency[]  = ["USD", "EUR", "GBP", "INR", "AED"];
const VALID_METHODS                  = ["bank", "card", "wallet"];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Round a JS number to 2 decimal places and return as a fixed string. */
function toFixed2(n: number): string {
  return n.toFixed(2);
}

/** frontend lowercase → DB uppercase enum string */
function toPaymentMethod(pm: string): DbPaymentMethod {
  return (pm?.toUpperCase() ?? "BANK") as DbPaymentMethod;
}

function toRecurringFreq(freq: string | null | undefined): DbRecurringFreq | null {
  if (!freq) return null;
  return freq.toUpperCase() as DbRecurringFreq;
}

// ── Input validation ──────────────────────────────────────────────────────────
function validateBody(body: any): { error: string } | null {
  const { recipientEmail, amount, currency, paymentMethod } = body;

  if (
    !recipientEmail ||
    typeof recipientEmail !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)
  ) {
    return { error: "Invalid recipient email address." };
  }

  const amt = Number(amount);
  if (!amount || isNaN(amt) || amt <= 0) {
    return { error: "Amount must be greater than 0." };
  }

  if (currency && !VALID_CURRENCIES.includes(currency as Currency)) {
    return { error: `Unsupported currency: ${currency}` };
  }

  if (paymentMethod && !VALID_METHODS.includes(paymentMethod)) {
    return { error: `Unsupported payment method: ${paymentMethod}` };
  }

  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Auth guard
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const senderId = (session.user as any).id as string;

  // Parse body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  // Validate
  const validationError = validateBody(body);
  if (validationError) {
    return NextResponse.json({ message: validationError.error }, { status: 400 });
  }

  const {
    recipientEmail,
    amount,
    currency           = "USD",
    paymentMethod      = "bank",
    note,
    scheduleDate,
    isRecurring        = false,
    recurringFrequency,
  } = body;

  // Work with plain numbers; store as fixed-point strings for the DB
  const amountNum = parseFloat(toFixed2(Number(amount)));
  const feeNum    = parseFloat(toFixed2(FEES[paymentMethod] ?? 0));
  const totalNum  = parseFloat(toFixed2(amountNum + feeNum));

  // ── Load sender ───────────────────────────────────────────────────────────
  const senderRecord = await (prisma as any).user.findUnique({ where: { id: senderId } });
  if (!senderRecord) {
    return NextResponse.json({ message: "Sender account not found." }, { status: 400 });
  }
  if (senderRecord.email.toLowerCase() === recipientEmail.toLowerCase()) {
    return NextResponse.json({ message: "You cannot send money to yourself." }, { status: 400 });
  }

  // Balance check (Prisma returns Decimal; coerce to number for comparison)
  const currentBalance = parseFloat(senderRecord.balance.toString());
  if (currentBalance < totalNum) {
    return NextResponse.json(
      { message: "Insufficient balance (including fees)." },
      { status: 400 },
    );
  }

  // Look up recipient (may not be registered yet)
  const recipientRecord = await (prisma as any).user.findUnique({
    where: { email: recipientEmail.toLowerCase().trim() },
  });

  try {
    // ── Atomic DB transaction ─────────────────────────────────────────────
    const tx = await (prisma as any).$transaction(async (db: any) => {
      // 1. Deduct sender balance
      await db.user.update({
        where: { id: senderId },
        data:  { balance: { decrement: totalNum } },
      });

      // 2. Credit recipient (only if registered)
      if (recipientRecord) {
        await db.user.update({
          where: { id: recipientRecord.id },
          data:  { balance: { increment: amountNum } },
        });
      }

      // 3. Record transaction row
      const isScheduled: boolean =
        Boolean(scheduleDate) && new Date(scheduleDate) > new Date();

      const status: DbStatus = isScheduled ? "PENDING" : "COMPLETED";

      const newTx = await db.transaction.create({
        data: {
          senderId,
          recipientId:       recipientRecord?.id ?? null,
          recipientEmail:    recipientEmail.toLowerCase().trim(),
          amount:            amountNum,
          fee:               feeNum,
          currency:          currency as Currency,
          status,
          paymentMethod:     toPaymentMethod(paymentMethod),
          note:              note?.trim() || null,
          scheduledAt:       scheduleDate ? new Date(scheduleDate) : null,
          isRecurring:       Boolean(isRecurring),
          recurringFrequency: isRecurring ? toRecurringFreq(recurringFrequency) : null,
        },
      });

      return newTx;
    });

    return NextResponse.json({
      message:       "Transaction successful.",
      transactionId: tx.id,
    });
  } catch (err: any) {
    console.error("[POST /api/transactions/send]", err);

    if (err?.code === "P2002") {
      return NextResponse.json({ message: "Duplicate transaction detected." }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Transaction failed. Please try again." },
      { status: 500 },
    );
  }
}