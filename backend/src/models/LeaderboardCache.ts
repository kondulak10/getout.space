import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry {
  userId: mongoose.Types.ObjectId;
  stravaId: number;
  username: string;
  imghex: string;
  profileImageUrl?: string;
  hexagonCount: number;
  activityCount: number;
  totalDistance: number;
  rank: number;
}

export interface ILeaderboardCache extends Document {
  type: 'global' | 'weekly' | 'monthly'; // Allow for different leaderboard types
  entries: ILeaderboardEntry[];
  lastUpdated: Date;
  nextUpdate: Date;
}

const LeaderboardEntrySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  stravaId: { type: Number, required: true },
  username: { type: String, required: true },
  imghex: { type: String, required: true },
  profileImageUrl: String,
  hexagonCount: { type: Number, required: true },
  activityCount: { type: Number, required: true },
  totalDistance: { type: Number, required: true },
  rank: { type: Number, required: true },
}, { _id: false });

const LeaderboardCacheSchema = new Schema<ILeaderboardCache>({
  type: {
    type: String,
    enum: ['global', 'weekly', 'monthly'],
    required: true,
    unique: true,
  },
  entries: [LeaderboardEntrySchema],
  lastUpdated: { type: Date, required: true },
  nextUpdate: { type: Date, required: true },
}, { timestamps: true });

// Index for quick lookups
LeaderboardCacheSchema.index({ type: 1 });

export default mongoose.model<ILeaderboardCache>('LeaderboardCache', LeaderboardCacheSchema);
