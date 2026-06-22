import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../libs/mongoConnect";
import User from "../../../models/User";
import { registerSchema } from "../../../libs/validators";
import { validate, readJson } from "../../../libs/validate";
import { enforce, limiters, clientIp } from "../../../libs/ratelimit";
import { log } from "../../../libs/logger";

const logger = log("auth/register");

export async function POST(req: NextRequest) {
  // Rate limit by IP to blunt credential-stuffing / spam signups.
  const limited = await enforce(limiters.auth, `register:${clientIp(req)}`);
  if (limited) return limited;

  const parsed = await readJson(req);
  if (!parsed.ok) return parsed.response!;

  const result = validate(registerSchema, parsed.body);
  if (!result.ok) return result.response!;

  const { name, email, password } = result.data!;

  try {
    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: normalizedEmail, password: hashedPassword });

    return NextResponse.json(
      { message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email } },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, "register failed");
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
