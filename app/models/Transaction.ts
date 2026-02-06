import mongoose, { Schema, Document, Model } from 'mongoose';


export interface ITransaction extends Document {
user: mongoose.Types.ObjectId;
amount: number;
type: 'income' | 'expense';
category?: string;
note?: string;
date: Date;
}


const TransactionSchema = new Schema<ITransaction>({
user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
amount: { type: Number, required: true },
type: { type: String, enum: ['income', 'expense'], required: true },
category: { type: String },
note: { type: String },
date: { type: Date, default: Date.now },
}, { timestamps: true });


export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);