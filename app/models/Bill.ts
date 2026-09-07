// app/models/Bill.ts — a recurring or one-off bill the user tracks in FinFlow.
import mongoose, { Schema, Document, Model } from "mongoose";

export type BillStatus = "pending" | "paid";

export interface IBill extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  logo: string;          // emoji shown in the list
  status: BillStatus;
  autopay: boolean;
  paidAt?: Date | null;
  lastTransaction?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    user:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name:     { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, maxlength: 40, default: "Utilities" },
    amount:   { type: Number, required: true, min: 0.01 },
    dueDate:  { type: Date, required: true },
    logo:     { type: String, default: "🧾", maxlength: 8 },
    status:   { type: String, enum: ["pending", "paid"], default: "pending", index: true },
    autopay:  { type: Boolean, default: false },
    paidAt:   { type: Date, default: null },
    lastTransaction: { type: Schema.Types.ObjectId, ref: "Transaction", default: null },
  },
  { timestamps: true },
);

BillSchema.index({ user: 1, dueDate: 1 });

export const Bill: Model<IBill> =
  (mongoose.models.Bill as Model<IBill>) || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;
