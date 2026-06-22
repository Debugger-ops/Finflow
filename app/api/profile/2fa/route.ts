// app/api/profile/2fa/route.ts
// GET   -> current 2FA status
// POST  -> action: "enroll" | "verify" | "disable"
//   enroll:  generates a secret (not yet enabled), returns otpauth URL for a QR
//   verify:  confirms a 6-digit code and enables 2FA
//   disable: turns 2FA off (requires a valid current code)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import UserSettings, { getOrCreateSettings } from "../../../models/UserSettings";
import { generateSecret, otpauthURL, verifyTOTP } from "../../../libs/totp";
import { logActivity } from "../../../libs/activity-logger";
import { z } from "zod";

const bodySchema = z.object({
  action: z.enum(["enroll", "verify", "disable"]),
  code: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const settings = await getOrCreateSettings(userId);
  return NextResponse.json({ success: true, data: { enabled: settings.twoFactorEnabled } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const email = (session?.user as any)?.email ?? "user";
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.issues }, { status: 400 });
  }

  await connectDB();
  const { action, code } = parsed.data;

  if (action === "enroll") {
    const secret = generateSecret();
    // Store the pending secret (select:false field) but keep 2FA disabled until verified.
    await UserSettings.findOneAndUpdate(
      { userId },
      { $set: { twoFactorSecret: secret, twoFactorEnabled: false } },
      { upsert: true },
    );
    return NextResponse.json({
      success: true,
      data: { secret, otpauthUrl: otpauthURL(secret, email) },
      message: "Scan the QR code, then verify a code to finish enabling 2FA.",
    });
  }

  // verify + disable both need the secret and a code.
  const settings = await UserSettings.findOne({ userId }).select("+twoFactorSecret");
  if (!settings?.twoFactorSecret) {
    return NextResponse.json({ error: "Start enrollment first." }, { status: 400 });
  }
  if (!code || !verifyTOTP(settings.twoFactorSecret, code)) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
  }

  if (action === "verify") {
    settings.twoFactorEnabled = true;
    await settings.save();
    await logActivity({ userId, action: "Two-factor authentication enabled", request: req });
    return NextResponse.json({ success: true, message: "Two-factor authentication enabled." });
  }

  // disable
  settings.twoFactorEnabled = false;
  settings.twoFactorSecret = null;
  await settings.save();
  await logActivity({ userId, action: "Two-factor authentication disabled", request: req });
  return NextResponse.json({ success: true, message: "Two-factor authentication disabled." });
}
