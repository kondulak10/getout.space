import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Activity
export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;

  // Identifiers
  stravaActivityId: number;
  userId: mongoose.Types.ObjectId;

  // Source tracking
  source: 'webhook' | 'api';

  // Basic info
  name: string;
  type: string; // "Run", "Ride", "Swim", etc.
  sportType?: string; // "TrailRun", "MountainBikeRide", "VirtualRide", etc.
  description?: string;

  // Timing
  startDate: Date; // UTC
  startDateLocal: Date; // Local time
  timezone?: string;
  movingTime: number; // seconds (excludes stops)
  elapsedTime: number; // seconds (includes stops)

  // Metrics
  distance: number; // meters
  elevationGain: number; // meters
  averageSpeed: number; // m/s (Strava native)

  // Location
  startLocation?: {
    lat: number;
    lng: number;
  };
  endLocation?: {
    lat: number;
    lng: number;
  };

  // Route data
  summaryPolyline?: string; // Encoded polyline

  // Flags
  isManual: boolean;
  isPrivate: boolean;

  // Timestamps (auto-managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema
const activitySchema = new Schema<IActivity>(
  {
    stravaActivityId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['webhook', 'api'],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    sportType: {
      type: String,
    },
    description: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
      index: true, // For sorting by date
    },
    startDateLocal: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
    },
    movingTime: {
      type: Number,
      required: true,
    },
    elapsedTime: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    elevationGain: {
      type: Number,
      required: true,
    },
    averageSpeed: {
      type: Number,
      required: true,
    },
    startLocation: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      required: false,
      _id: false,
    },
    endLocation: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      required: false,
      _id: false,
    },
    summaryPolyline: {
      type: String,
    },
    isManual: {
      type: Boolean,
      required: true,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for efficient user activity queries
activitySchema.index({ userId: 1, startDate: -1 });

// Create and export the model
export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
