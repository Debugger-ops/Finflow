import mongoose, { Schema, Document, Model } from "mongoose";

// SECURITY: We never store the full card number or CVV (PCI-DSS forbids storing
// CVV at all). Cards are tokenized by Stripe on the client; we persist only the
// Stripe PaymentMethod id plus safe display fields.
export interface ICard extends Document {
  user: mongoose.Types.ObjectId;
  cardName: string;
  stripePaymentMethodId: string;
  brand: string; // e.g. "visa"
  last4: string; // e.g. "4242"
  expMonth: number;
  expYear: number;
  cardType: "debit" | "credit" | "virtual";
  frozen: boolean; // user can freeze/unfreeze
  spendLimit: number | null; // monthly spend cap, null = no limit
  isDefault: boolean;
  createdAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cardName: { type: String, required: true },
    stripePaymentMethodId: { type: String, required: true, unique: true },
    brand: { type: String, required: true },
    last4: { type: String, required: true },
    expMonth: { type: Number, required: true },
    expYear: { type: Number, required: true },
    cardType: { type: String, enum: ["debit", "credit", "virtual"], default: "debit" },
    frozen: { type: Boolean, default: false },
    spendLimit: { type: Number, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Card: Model<ICard> =
  (mongoose.models.Card as Model<ICard>) || mongoose.model<ICard>("Card", CardSchema);
