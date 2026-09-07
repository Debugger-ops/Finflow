// app/api/orders/route.ts — the signed-in user's recent buy/sell orders.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import OrderModel from "../../models/Order";
import { log } from "../../libs/logger";

const logger = log("orders");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "10", 10)));

  try {
    await connectDB();
    const orders = await OrderModel.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: (orders as any[]).map((o) => ({
        id: String(o._id),
        type: o.type,
        symbol: o.symbol,
        name: o.name,
        shares: o.shares,
        price: o.price,
        total: o.total,
        status: o.status,
        createdAt: new Date(o.createdAt).toISOString(),
      })),
    });
  } catch (err) {
    logger.error({ err }, "order list failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
