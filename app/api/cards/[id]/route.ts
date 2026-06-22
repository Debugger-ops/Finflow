// app/api/cards/[id]/route.ts
// PATCH: freeze/unfreeze, set spend limit, set default. DELETE: remove a card.
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import { Card } from "../../../models/Card";
import { logActivity } from "../../../libs/activity-logger";
import { z } from "zod";

const patchSchema = z.object({
  frozen: z.boolean().optional(),
  spendLimit: z.number().nonnegative().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
  }

  await connectDB();

  // If setting this card default, clear the flag on the user's other cards.
  if (parsed.data.isDefault) {
    await Card.updateMany({ user: userId }, { isDefault: false });
  }

  const card = await Card.findOneAndUpdate({ _id: id, user: userId }, { $set: parsed.data }, { new: true });
  if (!card) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  const action = parsed.data.frozen === true ? "Card frozen" : parsed.data.frozen === false ? "Card unfrozen" : "Card updated";
  await logActivity({ userId, action, request: req, metadata: { cardId: id } });

  return NextResponse.json({ success: true, message: action });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const deleted = await Card.findOneAndDelete({ _id: id, user: userId });
  if (!deleted) return NextResponse.json({ error: "Card not found" }, { status: 404 });

  await logActivity({ userId, action: "Card removed", request: req, metadata: { cardId: id } });
  return NextResponse.json({ success: true, message: "Card removed" });
}
