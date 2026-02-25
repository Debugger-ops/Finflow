import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface ITransaction extends Document {
  sender: mongoose.Types.ObjectId;

  // ✅ Real user transfer
  recipient?: mongoose.Types.ObjectId;

  // ✅ Demo / external recipient
  recipientEmail?: string;

  amount: number;
  note?: string;
  paymentMethod?: string;
  scheduleDate?: Date | null;
  status: "pending" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User" }, // optional for demo
    recipientEmail: { type: String }, // optional for demo
    amount: { type: Number, required: true },
    note: { type: String },
    paymentMethod: { type: String },
    scheduleDate: { type: Date, default: null },
    status: { type: String, enum: ["pending", "completed"], required: true },
  },
  { timestamps: true }
);

// ✅ Prevent model overwrite in Next.js hot reload
const Transaction: Model<ITransaction> =
  models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;