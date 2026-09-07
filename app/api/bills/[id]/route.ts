// app/api/bills/[id]/route.ts — delete one of the signed-in user's bills.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import Bill from "../../../models/Bill";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid bill ID" }, { status: 400 });
  }

  await connectDB();
  const deleted = await Bill.findOneAndDelete({ _id: id, user: userId });
  if (!deleted) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
