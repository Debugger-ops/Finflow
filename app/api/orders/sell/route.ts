import { NextRequest, NextResponse } from "next/server";
import  { connectDB } from "../../../libs/mongoConnect";
import OrderModel from "../../../models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    await connectDB;

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { symbol, name, shares, price } = await req.json();
    if (!symbol || !shares || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const total = shares * price;

    const order = await OrderModel.create({
      userId: session.user.email,
      type: "sell",
      symbol,
      name,
      shares,
      price,
      total,
      status: "completed",
    });

    return NextResponse.json({ message: "Sell order placed", order }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
