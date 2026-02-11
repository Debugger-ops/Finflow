import { NextResponse } from "next/server";
import { connectDB } from "../../../libs/mongoConnect";
import Goal, { IGoal } from "../../../models/Goal";
import mongoose from "mongoose";

// app/api/goals/[id]/route.ts (PATCH/PUT)
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await connectDB();

  const body = await req.json();

  // Only increment current if provided
  const update: any = {};
  if (body.current !== undefined) update.$inc = { current: Number(body.current) };

  const updatedGoal = await Goal.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!updatedGoal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  return NextResponse.json({ ...updatedGoal, id: updatedGoal._id.toString() });
}

/* ---------------- GET single goal ---------------- */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // unwrap params

  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  const goal = await Goal.findById(id).lean<IGoal>();
  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ...goal, id: goal._id.toString() });
}

/* ---------------- UPDATE goal ---------------- */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // unwrap params

  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  const body = await req.json();

  if (body.target !== undefined) body.target = Number(body.target);
  if (body.current !== undefined) body.current = Number(body.current);
  if (body.monthlyContribution !== undefined)
    body.monthlyContribution = Number(body.monthlyContribution);
  if (body.deadline) body.deadline = new Date(body.deadline);

  await Goal.findByIdAndUpdate(id, body, { runValidators: true });

  const updatedGoal = await Goal.findById(id).lean<IGoal>();
  if (!updatedGoal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ ...updatedGoal, id: updatedGoal._id.toString() });
}

/* ---------------- DELETE goal ---------------- */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // unwrap params

  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid goal ID" }, { status: 400 });
  }

  const deletedGoal = await Goal.findByIdAndDelete(id).lean<IGoal>();
  if (!deletedGoal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
