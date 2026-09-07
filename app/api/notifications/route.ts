// app/api/notifications/route.ts
// GET  -> the signed-in user's notifications (newest first) + unread count
// PATCH-> mark one notification read ({ id }) or all of them ({ all: true })
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../libs/auth";
import { connectDB } from "../../libs/mongoConnect";
import { Notification } from "../../models/Notification";
import { log } from "../../libs/logger";

const logger = log("notifications");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(50, Math.max(1, parseInt(new URL(req.url).searchParams.get("limit") ?? "20", 10)));

  try {
    await connectDB();
    const [rows, unread] = await Promise.all([
      Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(limit).lean(),
      Notification.countDocuments({ user: userId, read: false }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        unread,
        notifications: (rows as any[]).map((n) => ({
          id: String(n._id),
          title: n.title,
          body: n.body ?? "",
          read: !!n.read,
          createdAt: new Date(n.createdAt).toISOString(),
        })),
      },
    });
  } catch (err) {
    logger.error({ err }, "notification list failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { id?: string; all?: boolean };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    await connectDB();
    if (payload.all) {
      await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
    } else if (payload.id) {
      // scoped to the owner so one user can't flip another user's notification
      await Notification.updateOne({ _id: payload.id, user: userId }, { $set: { read: true } });
    } else {
      return NextResponse.json({ error: "Provide `id` or `all: true`" }, { status: 400 });
    }
    const unread = await Notification.countDocuments({ user: userId, read: false });
    return NextResponse.json({ success: true, data: { unread } });
  } catch (err) {
    logger.error({ err }, "notification update failed");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
