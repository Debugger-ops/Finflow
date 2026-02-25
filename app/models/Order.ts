import mongoose, { Schema, model, models } from "mongoose";

interface Order {
  userId: string;
  type: "buy" | "sell";
  symbol: string;
  name: string;
  shares: number;
  price: number;
  total: number;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
}

const orderSchema = new Schema<Order>({
  userId: { type: String, required: true },
  type: { type: String, enum: ["buy", "sell"], required: true },
  symbol: { type: String, required: true },
  name: { type: String, required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const OrderModel = models.Order || model<Order>("Order", orderSchema);
export default OrderModel;
