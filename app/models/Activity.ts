import mongoose, { Schema, Document, Model, models } from 'mongoose';

export interface IActivity extends Document {
  userId: string;
  action: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
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
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

const Activity: Model<IActivity> =
  (models.Activity as Model<IActivity>) || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
