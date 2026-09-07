// app/api/goals/route.ts
// SECURITY FIX: this route previously returned every goal in the database to
// anyone who asked, and created goals with no owner. Goals are now scoped to
// the signed-in user.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import Goal from "../../models/Goal";
import { log } from "../../libs/logger";

const logger = log("goals");

async function requireUser() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

// GET — the signed-in user's goals
export async function GET() {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(goals.map((g: any) => ({ ...g, _id: String(g._id) })));
  } catch (err) {
    logger.error({ err }, "goal list failed");
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

// POST — create a goal owned by the signed-in user
export async function POST(req: Request) {
  const userId = await requireUser();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.target || !body.deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const target = Number(body.target);
    if (!Number.isFinite(target) || target <= 0) {
      return NextResponse.json({ error: "Target must be a positive number" }, { status: 400 });
    }

    const goal = await Goal.create({
      userId,
      name: String(body.name).trim(),
      description: body.description?.trim() || "",
      current: 0,
      target,
      monthlyContribution: Number(body.monthlyContribution) || 0,
      deadline: new Date(body.deadline),
      category: body.category || "emergency",
      icon: body.icon || "shield",
      priority: body.priority || "medium",
    });

    return NextResponse.json({ ...goal.toObject(), _id: String(goal._id) }, { status: 201 });
  } catch (err) {
    logger.error({ err }, "goal create failed");
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 });
  }
}
