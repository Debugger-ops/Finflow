import mongoose, { Schema, model } from "mongoose";

const PortfolioSchema = new Schema({
  userId: { type: String, required: true },
  investments: [
    {
      symbol: String,
      type: String, // stock, mutual fund, crypto
      quantity: Number,
      avgPrice: Number,
      dateBought: Date
    }
  ]
}, { timestamps: true });

export default mongoose.models.Portfolio || model("Portfolio", PortfolioSchema);
