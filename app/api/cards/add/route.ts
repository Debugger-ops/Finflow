import { NextResponse } from "next/server";
import { connectDB } from "../../../libs/mongoConnect";
import { Card } from "../../../models/Card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../libs/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { cardNumber, cardName, expiryDate, cvv } = await req.json();

    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const card = await Card.create({
      user: session.user.id,
      cardNumber,
      cardName,
      expiryDate,
      cvv,
    });

    return NextResponse.json({ message: "Card added successfully", card }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to add card" }, { status: 500 });
  }
}
