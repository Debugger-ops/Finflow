import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../libs/mongoConnect";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { recipientEmail, amount, note, paymentMethod, scheduleDate } = body;

    const recipientEmailValue = (recipientEmail || "").trim().toLowerCase();
    const amountNumber = Number(amount);

    console.log("DEBUG /send request:", { recipientEmailValue, amountNumber, note, paymentMethod, scheduleDate });

    // Validate input
    if (!recipientEmailValue || isNaN(amountNumber) || amountNumber <= 0) {
      return NextResponse.json({ message: "Invalid request data" }, { status: 400 });
    }

    const sender = await User.findById(session.user.id);
    if (!sender) {
      return NextResponse.json({ message: "Sender not found" }, { status: 404 });
    }

    // Prevent sending to yourself
    if (sender.email.toLowerCase() === recipientEmailValue) {
      return NextResponse.json({ message: "Cannot send money to yourself" }, { status: 400 });
    }

    // Check demo mode
    const isDemo = (sender as any).isDemo || false;

    // Find recipient (case-insensitive)
    let recipientUser: typeof sender | null = null;
    if (!isDemo) {
      recipientUser = await User.findOne({
        email: { $regex: `^${recipientEmailValue}$`, $options: "i" },
      });

      if (!recipientUser) {
        
        return NextResponse.json({ message: "Recipient not found" }, { status: 404 });
      }
    }

    // Check sender balance
    if (!isDemo && sender.balance < amountNumber) {
      return NextResponse.json({ message: "Insufficient balance" }, { status: 400 });
    }

    // Update balances
    if (!isDemo) {
      sender.balance -= amountNumber;
      recipientUser!.balance += amountNumber;
      await sender.save();
      await recipientUser!.save();
    }

    // Transaction status
    const transactionStatus = scheduleDate ? "pending" : "completed";

    const transaction = await Transaction.create({
      sender: sender._id,
      recipient: recipientUser?._id || null,
      recipientEmail: recipientEmailValue,
      amount: amountNumber,
      note: note || "",
      paymentMethod: paymentMethod || "Bank Account",
      scheduleDate: scheduleDate ? new Date(scheduleDate) : null,
      status: transactionStatus,
    });

    return NextResponse.json({
      success: true,
      message: "Transaction successful",
      transaction,
      balance: sender.balance,
    });
  } catch (err) {
    console.error("SEND TRANSACTION ERROR:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}