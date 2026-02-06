import mongoose, { Schema, Document, Model } from 'mongoose';


export interface IGoal extends Document {
user: mongoose.Types.ObjectId;
title: string;
targetAmount: number;
savedAmount: number;
dueDate?: Date;
completed: boolean;
}


const GoalSchema = new Schema<IGoal>({
user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
title: { type: String, required: true },
targetAmount: { type: Number, required: true },
savedAmount: { type: Number, default: 0 },
dueDate: { type: Date },
completed: { type: Boolean, default: false },
}, { timestamps: true });


export const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);