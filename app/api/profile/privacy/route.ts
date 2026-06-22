import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import { getOrCreateSettings } from "../../../models/UserSettings";
import { logActivity } from "../../../libs/activity-logger";
import { z } from "zod";

const schema = z.object({
  profileVisibility: z.enum(["public", "private", "friends"]).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLocation: z.boolean().optional(),
  allowMessages: z.boolean().optional(),
  showActivity: z.boolean().optional(),
  searchable: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const settings = await getOrCreateSettings((session!.user as any).id);
  return NextResponse.json({ success: true, data: settings.privacy });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
  }

  await connectDB();
  const userId = (session!.user as any).id;
  const settings = await getOrCreateSettings(userId);
  Object.assign(settings.privacy, parsed.data); // previously dropped — schema now defines these fields
  await settings.save();

  await logActivity({ userId, action: "Privacy settings updated", request });
  return NextResponse.json({ success: true, message: "Privacy settings updated", data: settings.privacy });
}
