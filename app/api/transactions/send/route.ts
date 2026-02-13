import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../libs/mongoConnect";
import User from "../../../models/User";
import { Transaction } from "../../../models/Transaction";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1️⃣ Check user session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipient, amount, note, paymentMethod, scheduleDate } = body;

    // 2️⃣ Validate request
    if (!recipient || !amount) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 3️⃣ Find sender and recipient
    const senderUser = await User.findById(session.user.id);
    if (!senderUser) return NextResponse.json({ message: "Sender not found" }, { status: 404 });

    const recipientUser = await User.findOne({ email: recipient });
    if (!recipientUser) return NextResponse.json({ message: "Recipient not found" }, { status: 404 });

    // 4️⃣ Check balance and self-transfer
    if (senderUser._id.equals(recipientUser._id)) {
      return NextResponse.json({ message: "Cannot send money to yourself" }, { status: 400 });
    }

    if (!scheduleDate && senderUser.balance < amount) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
    }

    // 5️⃣ Start Mongo transaction
    const sessionMongo = await mongoose.startSession();
    sessionMongo.startTransaction();

    try {
      if (!scheduleDate) {
        // Deduct from sender & add to recipient only for instant payments
        senderUser.balance -= amount;
        recipientUser.balance += amount;

        await senderUser.save({ session: sessionMongo });
        await recipientUser.save({ session: sessionMongo });
      }

      // 6️⃣ Create transaction record
      await Transaction.create(
        {
          sender: senderUser._id,
          recipient: recipientUser._id,
          amount,
          note,
          paymentMethod,
          scheduleDate: scheduleDate ? new Date(scheduleDate) : null,
          status: scheduleDate ? "pending" : "completed",
        },
        { session: sessionMongo }
      );

      await sessionMongo.commitTransaction();
      sessionMongo.endSession();

      return NextResponse.json({ message: "Transaction successful" });
    } catch (err) {
      await sessionMongo.abortTransaction();
      sessionMongo.endSession();
      console.error(err);
      return NextResponse.json({ message: "Transaction failed" }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
