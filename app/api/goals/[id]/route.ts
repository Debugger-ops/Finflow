// app/api/goals/[id]/route.ts
// Every handler is scoped to { _id, userId } so one account can never read or
// mutate another account's goal (previously all of these took the id alone).
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import Goal, { IGoal } from "../../../models/Goal";
import { log } from "../../../libs/logger";

const logger = log("goals/[id]");

async function guard(id: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!mongoose.Types.ObjectId.isValid(id))
    return { error: NextResponse.json({ error: "Invalid goal ID" }, { status: 400 }) };
  await connectDB();
  return { userId };
}

const notFound = () => NextResponse.json({ error: "Goal not found" }, { status: 404 });

/* ---------------- GET one ---------------- */
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const g = await guard(id);
  if (g.error) return g.error;

  const goal = await Goal.findOne({ _id: id, userId: g.userId }).lean<IGoal>();
  if (!goal) return notFound();
  return NextResponse.json({ ...goal, id: String(goal._id) });
}

/* ---------------- PATCH (increment progress) ---------------- */
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const g = await guard(id);
  if (g.error) return g.error;

  const body = await req.json().catch(() => ({}));
  if (body.current === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  const delta = Number(body.current);
  if (!Number.isFinite(delta)) {
    return NextResponse.json({ error: "`current` must be a number" }, { status: 400 });
  }

  const updated = await Goal.findOneAndUpdate(
    { _id: id, userId: g.userId },
    { $inc: { current: delta } },
    { new: true },
  ).lean<IGoal>();
  if (!updated) return notFound();

  return NextResponse.json({ ...updated, id: String(updated._id) });
}

/* ---------------- PUT (full update) ---------------- */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const g = await guard(id);
  if (g.error) return g.error;

  const body = await req.json().catch(() => ({}));
  // Ownership is never client-settable.
  delete body.userId;
  delete body._id;

  if (body.target !== undefined) body.target = Number(body.target);
  if (body.current !== undefined) body.current = Number(body.current);
  if (body.monthlyContribution !== undefined) body.monthlyContribution = Number(body.monthlyContribution);
  if (body.deadline) body.deadline = new Date(body.deadline);

  try {
    const updated = await Goal.findOneAndUpdate(
      { _id: id, userId: g.userId },
      body,
      { new: true, runValidators: true },
    ).lean<IGoal>();
    if (!updated) return notFound();
    return NextResponse.json({ ...updated, id: String(updated._id) });
  } catch (err) {
    logger.error({ err }, "goal update failed");
    return NextResponse.json({ error: "Failed to update goal" }, { status: 400 });
  }
}

/* ---------------- DELETE ---------------- */
export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const g = await guard(id);
  if (g.error) return g.error;

  const deleted = await Goal.findOneAndDelete({ _id: id, userId: g.userId }).lean<IGoal>();
  if (!deleted) return notFound();
  return NextResponse.json({ success: true });
}
