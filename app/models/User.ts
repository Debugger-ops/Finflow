import mongoose, { Schema, Model, models, Document, Types } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  balance: number;
   isDemo?: boolean; 
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
  profile?: IProfile;
}

export interface IProfile {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  marketingNotifications?: boolean;
  securityNotifications?: boolean;
  updateNotifications?: boolean;
  mentionNotifications?: boolean;
  commentNotifications?: boolean;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // ✅ Password field added
    balance: { type: Number, default: 0 },
    image: { type: String, default: null },
    bio: { type: String, default: "" },
    phone: { type: String, default: null },
    isDemo: { type: Boolean, default: false }, // <-- add this
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
    profile: {
      emailNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: false },
      marketingNotifications: { type: Boolean, default: false },
      securityNotifications: { type: Boolean, default: false },
      updateNotifications: { type: Boolean, default: false },
      mentionNotifications: { type: Boolean, default: false },
      commentNotifications: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User: Model<IUser> = models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
