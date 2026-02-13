import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../libs/mongoConnect";
import User from "../../../models/User";
import { setCookie } from "cookies-next";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    // ✅ Set cookie
    const res = NextResponse.json({ success: true, message: "Login successful", user: { id: user._id, name: user.name } });
    setCookie("user_session", JSON.stringify({ id: user._id, name: user.name }), { req, res, maxAge: 60 * 60 * 24 }); // 1 day cookie
    return res;

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
