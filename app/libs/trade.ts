// app/libs/trade.ts
// Executes buy/sell trades: moves cash, updates the Holding position (with
// weighted-average cost basis), and records an Order. Shared by the order
// routes and the seed script so investing data stays internally consistent.
import User from "../models/User";
import Holding from "../models/Holding";
import OrderModel from "../models/Order";

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface TradeInput {
  userId: string;
  side: "buy" | "sell";
  symbol: string;
  name?: string;
  shares: number;
  price: number;
  assetType?: "stock" | "etf" | "crypto";
}

// Flat shape (optional fields) — strict:false makes union narrowing unreliable.
export interface TradeResult {
  ok: boolean;
  orderId?: string;
  total?: number;
  status?: number;
  message?: string;
}

export async function executeTrade(input: TradeInput): Promise<TradeResult> {
  const { userId, side, symbol, name = "", shares, price, assetType = "stock" } = input;
  const sym = symbol.toUpperCase();
  const total = round2(shares * price);

  if (side === "buy") {
    // Balance-guarded debit prevents overspending cash.
    const debited = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: total } },
      { $inc: { balance: -total } },
      { new: true },
    );
    if (!debited) return { ok: false, status: 400, message: "Insufficient cash balance." };

    const existing = await Holding.findOne({ userId, symbol: sym });
    if (existing) {
      const newShares = existing.shares + shares;
      existing.avgCost = round2((existing.shares * existing.avgCost + shares * price) / newShares);
      existing.shares = newShares;
      await existing.save();
    } else {
      await Holding.create({ userId, symbol: sym, name, assetType, shares, avgCost: round2(price) });
    }
  } else {
    const holding = await Holding.findOne({ userId, symbol: sym });
    if (!holding || holding.shares < shares) {
      return { ok: false, status: 400, message: "You don't own enough shares to sell." };
    }
    holding.shares = round2(holding.shares - shares);
    if (holding.shares <= 0) await holding.deleteOne();
    else await holding.save();

    await User.findByIdAndUpdate(userId, { $inc: { balance: total } });
  }

  const order = await OrderModel.create({
    userId,
    type: side,
    symbol: sym,
    name,
    shares,
    price,
    total,
    status: "completed",
  });

  return { ok: true, orderId: order._id.toString(), total };
}
