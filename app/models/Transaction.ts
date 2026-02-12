import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface ITransaction extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  amount: number;
  note?: string;
  paymentMethod?: string;
  scheduleDate?: Date | null;
  status: "pending" | "completed";
  date: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    note: { type: String },
    paymentMethod: { type: String },
    scheduleDate: { type: Date, default: null },
    status: { type: String, enum: ["pending", "completed"], required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Transaction: Model<ITransaction> =
  models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
