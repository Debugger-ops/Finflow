// models/Session.ts
import mongoose, { Schema, Model, models } from "mongoose";

export interface ISession {
  userId: string;
  sessionToken: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  isActive: boolean;
  expires: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: { type: String, required: true },
    sessionToken: { type: String, required: true, unique: true },
    device: { type: String },
    location: { type: String },
    ipAddress: { type: String },
    isActive: { type: Boolean, default: true },
    expires: { type: Date, required: true },
  },
  { timestamps: true }
);

const Session: Model<ISession> = models.Session || mongoose.model<ISession>("Session", SessionSchema);

export default Session;
