// app/api/goals/[id]/contribute/route.ts
// Moving money into a goal now actually moves money: the amount is debited from
// the user's balance in the same conditional update that guards against an
// overdraft, and rolled back if the goal write fails. Previously the goal's
// progress went up while the balance was untouched.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "../../../../libs/auth";
import { connectDB } from "../../../../libs/mongoConnect";
import Goal from "../../../../models/Goal";
import User from "../../../../models/User";
import { Notification } from "../../../../models/Notification";
import { log } from "../../../../libs/logger";

const logger = log("goals/contribute");

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter an amount greater than zero" }, { status: 400 });
    }

    const goal = await Goal.findOne({ _id: id, userId });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    // Conditional debit: only succeeds while the balance still covers it, so
    // two concurrent contributions can't push the account negative.
    const debited = await User.findOneAndUpdate(
      { _id: userId, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true },
    );
    if (!debited) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    try {
      goal.current = (goal.current || 0) + amount;
      await goal.save();
    } catch (err) {
      await User.updateOne({ _id: userId }, { $inc: { balance: amount } });
      throw err;
    }

    const reached = goal.current >= goal.target;
    await Notification.create({
      user: userId,
      title: reached ? `Goal reached: ${goal.name}` : `Added to ${goal.name}`,
      body: reached
        ? `You hit your ${goal.target.toLocaleString()} target. Nice work.`
        : `$${amount.toLocaleString()} moved in. $${Math.max(goal.target - goal.current, 0).toLocaleString()} to go.`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      goal: { ...goal.toObject(), _id: String(goal._id) },
      balance: debited.balance,
    });
  } catch (err: any) {
    logger.error({ err }, "goal contribution failed");
    return NextResponse.json({ error: "Failed to add money" }, { status: 500 });
  }
}
