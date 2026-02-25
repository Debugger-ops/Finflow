import { NextResponse } from "next/server";
import Portfolio from "../../models/Portfolio";
import { connectDB } from "../../libs/mongoConnect";

export async function GET(req: Request, { params }: { params: any }) {
  await connectDB();
  const userId = params.userId;
  const portfolio = await Portfolio.findOne({ userId }).lean();
  return NextResponse.json(portfolio);
}

export async function POST(req: Request) {
  await connectDB();
  const data = await req.json();
  const portfolio = await Portfolio.findOneAndUpdate(
    { userId: data.userId },
    { $push: { investments: data.investment } },
    { new: true, upsert: true }
  );
  return NextResponse.json(portfolio);
}
