import mongoose, { Schema, Document, Model } from 'mongoose';


export interface INotification extends Document {
user: mongoose.Types.ObjectId;
title: string;
body?: string;
read: boolean;
}


const NotificationSchema = new Schema<INotification>({
user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
title: { type: String, required: true },
body: { type: String },
read: { type: Boolean, default: false },
}, { timestamps: true });


export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);