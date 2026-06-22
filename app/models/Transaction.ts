import mongoose, { Schema, Document, Model, models } from "mongoose";

export type Currency = "USD" | "EUR" | "GBP" | "INR" | "AED";
export type PaymentMethod = "bank" | "card" | "wallet";
export type RecurringFrequency = "weekly" | "monthly";
export type TxStatus = "pending" | "completed" | "failed";
export type TxCategory =
  | "transfer"
  | "bills"
  | "shopping"
  | "food"
  | "transport"
  | "entertainment"
  | "income"
  | "investment"
  | "other";

export interface ITransaction extends Document {
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId | null; // null when recipient isn't registered
  recipientEmail: string;
  amount: number;
  fee: number;
  currency: Currency;
  note?: string | null;
  paymentMethod: PaymentMethod;
  category: TxCategory;
  status: TxStatus;
  scheduledAt?: Date | null;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency | null;
  processedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    recipientEmail: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    fee: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, enum: ["USD", "EUR", "GBP", "INR", "AED"], default: "USD" },
    note: { type: String, default: null },
    paymentMethod: { type: String, enum: ["bank", "card", "wallet"], default: "bank" },
    category: {
      type: String,
      enum: ["transfer", "bills", "shopping", "food", "transport", "entertainment", "income", "investment", "other"],
      default: "transfer",
      index: true,
    },
    status: { type: String, enum: ["pending", "completed", "failed"], required: true, index: true },
    scheduledAt: { type: Date, default: null },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: { type: String, enum: ["weekly", "monthly"], default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Transaction: Model<ITransaction> =
  models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
