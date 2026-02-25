import { NextResponse } from "next/server";
import { connectDB } from "../../libs/mongoConnect";
import Goal from "../../models/Goal";

// GET all goals
export async function GET() {
  try {
    await connectDB();

    const goals = await Goal.find().sort({ createdAt: -1 }).lean();

    const serialized = goals.map(g => ({
      ...g,
      _id: g._id.toString(),
    }));

    return NextResponse.json(serialized);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST new goal
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    if (!body.name || !body.target || !body.deadline) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const goal = await Goal.create({
      name: body.name.trim(),
      description: body.description?.trim() || "",
      current: 0,
      target: Number(body.target),
      monthlyContribution: Number(body.monthlyContribution) || 0,
      deadline: new Date(body.deadline),
      category: body.category || "emergency",
      icon: body.icon || "shield",
      priority: body.priority || "medium",
    });

    return NextResponse.json(
      { ...goal.toObject(), _id: goal._id.toString() },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
