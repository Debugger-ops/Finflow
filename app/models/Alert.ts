import mongoose, { Schema, model } from "mongoose";

const AlertSchema = new Schema({
  userId: String,
  symbol: String,
  targetPrice: Number,
  type: String, // "buy" | "sell"
  active: { type: Boolean, default: true }
});

export default mongoose.models.Alert || model("Alert", AlertSchema);
