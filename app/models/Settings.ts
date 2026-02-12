import mongoose, { Schema, Document, Model } from 'mongoose';


export interface ISettings extends Document {
user: mongoose.Types.ObjectId;
currency: string;
notifications: {
email: boolean;
push: boolean;
};
}


const SettingsSchema = new Schema<ISettings>({
user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
currency: { type: String, default: 'INR' },
notifications: {
email: { type: Boolean, default: true },
push: { type: Boolean, default: true },
}
}, { timestamps: true });


export const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);