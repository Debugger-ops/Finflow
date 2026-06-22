import mongoose, { Schema, Document, Model, models } from "mongoose";

// One settings document per user. Replaces the fragmented Profile + Settings +
// User.profile stores that caused settings to silently not persist.

export interface INotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingNotifications: boolean;
  securityNotifications: boolean;
  updateNotifications: boolean;
  mentionNotifications: boolean;
  commentNotifications: boolean;
}

export interface IPrivacySettings {
  profileVisibility: "public" | "private" | "friends";
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  showActivity: boolean;
  searchable: boolean;
}

export interface IAppearanceSettings {
  darkMode: boolean;
  compactView: boolean;
  fontSize: "small" | "medium" | "large" | "xlarge";
  language: string;
  theme: "default" | "blue" | "green" | "purple";
}

export interface IUserSettings extends Document {
  userId: string;
  notifications: INotificationSettings;
  privacy: IPrivacySettings;
  appearance: IAppearanceSettings;
  currency: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_NOTIFICATIONS: INotificationSettings = {
  emailNotifications: true,
  pushNotifications: false,
  marketingNotifications: false,
  securityNotifications: true,
  updateNotifications: true,
  mentionNotifications: false,
  commentNotifications: false,
};

export const DEFAULT_PRIVACY: IPrivacySettings = {
  profileVisibility: "private",
  showEmail: false,
  showPhone: false,
  showLocation: false,
  allowMessages: true,
  showActivity: true,
  searchable: false,
};

export const DEFAULT_APPEARANCE: IAppearanceSettings = {
  darkMode: true,
  compactView: false,
  fontSize: "medium",
  language: "en",
  theme: "default",
};

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    notifications: {
      emailNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.emailNotifications },
      pushNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.pushNotifications },
      marketingNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.marketingNotifications },
      securityNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.securityNotifications },
      updateNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.updateNotifications },
      mentionNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.mentionNotifications },
      commentNotifications: { type: Boolean, default: DEFAULT_NOTIFICATIONS.commentNotifications },
    },
    privacy: {
      profileVisibility: { type: String, enum: ["public", "private", "friends"], default: DEFAULT_PRIVACY.profileVisibility },
      showEmail: { type: Boolean, default: DEFAULT_PRIVACY.showEmail },
      showPhone: { type: Boolean, default: DEFAULT_PRIVACY.showPhone },
      showLocation: { type: Boolean, default: DEFAULT_PRIVACY.showLocation },
      allowMessages: { type: Boolean, default: DEFAULT_PRIVACY.allowMessages },
      showActivity: { type: Boolean, default: DEFAULT_PRIVACY.showActivity },
      searchable: { type: Boolean, default: DEFAULT_PRIVACY.searchable },
    },
    appearance: {
      darkMode: { type: Boolean, default: DEFAULT_APPEARANCE.darkMode },
      compactView: { type: Boolean, default: DEFAULT_APPEARANCE.compactView },
      fontSize: { type: String, enum: ["small", "medium", "large", "xlarge"], default: DEFAULT_APPEARANCE.fontSize },
      language: { type: String, default: DEFAULT_APPEARANCE.language },
      theme: { type: String, enum: ["default", "blue", "green", "purple"], default: DEFAULT_APPEARANCE.theme },
    },
    currency: { type: String, default: "USD" },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: null, select: false },
  },
  { timestamps: true },
);

const UserSettings: Model<IUserSettings> =
  models.UserSettings || mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);

export default UserSettings;

/** Get the user's settings document, creating one with defaults if absent. */
export async function getOrCreateSettings(userId: string) {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) {
    settings = await UserSettings.create({ userId });
  }
  return settings;
}
