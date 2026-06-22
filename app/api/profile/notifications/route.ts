import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import { getOrCreateSettings } from "../../../models/UserSettings";
import { logActivity } from "../../../libs/activity-logger";
import { z } from "zod";

const schema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  marketingNotifications: z.boolean().optional(),
  securityNotifications: z.boolean().optional(),
  updateNotifications: z.boolean().optional(),
  mentionNotifications: z.boolean().optional(),
  commentNotifications: z.boolean().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectDB();
  const settings = await getOrCreateSettings((session!.user as any).id);
  // Always 200 with real saved values (defaults on first load) — never 404.
  return NextResponse.json({ success: true, data: settings.notifications });
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
  Object.assign(settings.notifications, parsed.data);
  await settings.save();

  await logActivity({ userId, action: "Notification settings updated", request });
  return NextResponse.json({ success: true, message: "Notification settings updated", data: settings.notifications });
}
