import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../libs/mongoConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { orderSchema } from "../../../libs/validators";
import { validate, readJson } from "../../../libs/validate";
import { enforce, limiters, clientIp } from "../../../libs/ratelimit";
import { executeTrade } from "../../../libs/trade";
import { log } from "../../../libs/logger";

const logger = log("orders/buy");

export async function POST(req: NextRequest) {
  try {
    const limited = await enforce(limiters.money, `buy:${clientIp(req)}`);
    if (limited) return limited;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = await readJson(req);
    if (!parsed.ok) return parsed.response!;
    const result = validate(orderSchema, parsed.body);
    if (!result.ok) return result.response!;

    await connectDB();

    const { symbol, name, shares, price } = result.data!;
    const trade = await executeTrade({ userId, side: "buy", symbol, name, shares, price });
    if (!trade.ok) return NextResponse.json({ error: trade.message }, { status: trade.status });

    return NextResponse.json(
      { message: "Buy order placed", orderId: trade.orderId, total: trade.total },
      { status: 201 },
    );
  } catch (err) {
    logger.error({ err }, "buy order failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
