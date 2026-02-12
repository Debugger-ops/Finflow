import mongoose, { Schema, Document, models } from 'mongoose';

export interface IActivity extends Document {
  userId: string;
  action: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    device: {
      type: String,
    },
    location: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
  },
  { timestamps: true }
);

export default models.Activity ||
  mongoose.model<IActivity>('Activity', ActivitySchema);
