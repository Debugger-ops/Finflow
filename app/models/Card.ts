import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICard extends Document {
  user: mongoose.Types.ObjectId;
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
  createdAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardNumber: { type: String, required: true },
    cardName: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true },
  },
  { timestamps: true }
);

export const Card: Model<ICard> = mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);
