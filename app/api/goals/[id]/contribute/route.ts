// app/api/goals/[id]/contribute/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "../../../../libs/mongoConnect";
import Goal from "../../../../models/Goal";
import mongoose from "mongoose";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Unwrap params
  const { id } = await params;

  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const goal = await Goal.findById(id);
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    goal.currentAmount = (goal.currentAmount || 0) + amount;
    await goal.save();

    return NextResponse.json({ success: true, goal });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to add money" }, { status: 500 });
  }
}
