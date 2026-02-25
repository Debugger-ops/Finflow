import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  darkMode?: boolean;
  compactView?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
  language?: string;
  theme?: 'default' | 'blue' | 'green' | 'purple';
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: { type: String, required: true, unique: true },
    darkMode: { type: Boolean, default: false },
    compactView: { type: Boolean, default: false },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large', 'xlarge'],
      default: 'medium',
    },
    language: { type: String, default: 'en' },
    theme: {
      type: String,
      enum: ['default', 'blue', 'green', 'purple'],
      default: 'default',
    },
  },
  { timestamps: true }
);

export default models.Profile || model<IProfile>('Profile', ProfileSchema);
