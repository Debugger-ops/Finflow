import mongoose, { Schema, Document, Model, models } from "mongoose";

// A position the user holds. Cost basis is tracked so P/L can be computed
// against live prices.
export interface IHolding extends Document {
  userId: string;
  symbol: string;
  name: string;
  assetType: "stock" | "etf" | "crypto";
  shares: number;
  avgCost: number; // average purchase price per share
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    name: { type: String, default: "" },
    assetType: { type: String, enum: ["stock", "etf", "crypto"], default: "stock" },
    shares: { type: Number, required: true, min: 0 },
    avgCost: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

HoldingSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Holding: Model<IHolding> =
  (models.Holding as Model<IHolding>) || mongoose.model<IHolding>("Holding", HoldingSchema);

export default Holding;
