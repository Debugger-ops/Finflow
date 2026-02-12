import mongoose, { Schema, Model, models, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  balance: number; // Added
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;

  bio?: string;
  phone?: string | null;
  location?: string | null;
  occupation?: string | null;
  dateOfBirth?: string | null;
  website?: string | null;

  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  instagram?: string | null;

  accounts?: Types.ObjectId[];
  sessions?: Types.ObjectId[];
  activities?: Types.ObjectId[];
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 }, // ✅ added default balance
    image: { type: String, default: "" },
    bio: { type: String, default: "" },

    phone: { type: String, default: null },
    location: { type: String, default: null },
    occupation: { type: String, default: null },
    dateOfBirth: { type: String, default: null },
    website: { type: String, default: null },

    github: { type: String, default: null },
    linkedin: { type: String, default: null },
    twitter: { type: String, default: null },
    instagram: { type: String, default: null },

    accounts: [{ type: Schema.Types.ObjectId, ref: "Account" }],
    sessions: [{ type: Schema.Types.ObjectId, ref: "Session" }],
    activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
  },
  { timestamps: true }
);

const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
