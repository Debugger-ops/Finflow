// app/api/user/balance/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../libs/auth";
import { connectDB } from "../../../libs/mongoConnect";
import User from "../../../models/User";
import { log } from "../../../libs/logger";

const logger = log("user/balance");

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = await User.findById((session.user as any).id).lean();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Return the real balance. (Previously this faked $500 when balance was 0,
    // which is dangerous in a money app — removed.)
    return NextResponse.json({ balance: user.balance ?? 0 });
  } catch (err) {
    logger.error({ err }, "balance lookup failed");
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
