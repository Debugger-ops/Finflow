// app/api/profile/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import Session from "../../../models/Session"; // Mongoose session model
import { logActivity } from "../../../libs/activity-logger";

// GET all active sessions for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    const sessions = await Session.find({
      userId: session.user.id,
      isActive: true,
      expires: { $gte: new Date() },
    }).sort({ createdAt: -1 });

    const formattedSessions = sessions.map((sess) => ({
      id: sess._id.toString(),
      device: sess.device || "Unknown device",
      location: sess.location || "Unknown location",
      ipAddress: sess.ipAddress,
      createdAt: sess.createdAt,
      isCurrent: sess.sessionToken === currentSessionToken,
    }));

    return NextResponse.json({ success: true, data: formattedSessions });
  } catch (error) {
    console.error("Fetch sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE a specific session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const sessionToDelete = await Session.findOne({
      _id: sessionId,
      userId: session.user.id,
    });

    if (!sessionToDelete) {
      return NextResponse.json({ error: "Session not found or does not belong to user" }, { status: 404 });
    }

    sessionToDelete.isActive = false;
    await sessionToDelete.save();

    await logActivity({
      userId: session.user.id,
      action: "Session terminated",
      request,
      metadata: { sessionId },
    });

    return NextResponse.json({ success: true, message: "Session terminated successfully" });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Terminate all other sessions except current
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentSessionToken =
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!currentSessionToken) {
      return NextResponse.json({ error: "Current session not found" }, { status: 400 });
    }

    await Session.updateMany(
      {
        userId: session.user.id,
        sessionToken: { $ne: currentSessionToken },
        isActive: true,
      },
      { isActive: false }
    );

    await logActivity({
      userId: session.user.id,
      action: "All other sessions terminated",
      request,
    });

    return NextResponse.json({ success: true, message: "All other sessions terminated successfully" });
  } catch (error) {
    console.error("Terminate all sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
