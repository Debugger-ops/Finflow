import mongoose, { Schema, Model, models } from "mongoose";

export interface IUser {
  name: string;
  email: string;
  password: string;
  company?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
