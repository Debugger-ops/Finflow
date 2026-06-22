// app/api/transactions/send/route.ts
// POST /api/transactions/send — validate, then debit sender / credit recipient
// (or schedule for the cron worker) via the shared transfer helper.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import { sendMoneySchema } from "../../../libs/validators";
import { validate, readJson } from "../../../libs/validate";
import { executeTransfer } from "../../../libs/transfer";
import { enforce, limiters, clientIp } from "../../../libs/ratelimit";
import { log } from "../../../libs/logger";

const logger = log("transactions/send");

export async function POST(req: NextRequest) {
  const limited = await enforce(limiters.money, `send:${clientIp(req)}`);
  if (limited) return limited;

  const session = await getServerSession(authOptions);
  const senderId = (session?.user as any)?.id;
  if (!senderId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response!;
  const result = validate(sendMoneySchema, parsed.body);
  if (!result.ok) return result.response!;

  try {
    await connectDB();
    const outcome = await executeTransfer({ senderId, ...result.data! });

    if (!outcome.ok) {
      return NextResponse.json({ message: outcome.message }, { status: outcome.httpStatus ?? 400 });
    }

    return NextResponse.json({
      message: outcome.status === "pending" ? "Transfer scheduled." : "Transaction successful.",
      transactionId: outcome.transactionId,
      status: outcome.status,
    });
  } catch (err) {
    logger.error({ err }, "transfer failed");
    return NextResponse.json({ message: "Transaction failed. Please try again." }, { status: 500 });
  }
}
