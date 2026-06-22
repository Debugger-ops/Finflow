import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface IWatchItem extends Document {
  userId: string;
  symbol: string;
  name: string;
  createdAt: Date;
}

const WatchlistSchema = new Schema<IWatchItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true },
    name: { type: String, default: "" },
  },
  { timestamps: true },
);

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Watchlist: Model<IWatchItem> =
  (models.Watchlist as Model<IWatchItem>) || mongoose.model<IWatchItem>("Watchlist", WatchlistSchema);

export default Watchlist;
