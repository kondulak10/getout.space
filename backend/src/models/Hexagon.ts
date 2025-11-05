import mongoose, { Document, Schema, Types } from 'mongoose';

// TypeScript interface for capture history entry
export interface ICaptureHistoryEntry {
  userId: Types.ObjectId;
  stravaId: number;
  activityId: Types.ObjectId;
  stravaActivityId: number;
  capturedAt: Date;
  activityType: string;
}

// TypeScript interface for Hexagon
export interface IHexagon extends Document {
  _id: Types.ObjectId;

  // Unique hexagon identifier (H3 index)
  hexagonId: string; // e.g., "8a2a1072b59ffff" (resolution 10)
  parentHexagonId: string; // Parent at resolution 6 for efficient querying

  // Current owner information
  currentOwnerId: Types.ObjectId; // User who currently owns this hex
  currentOwnerStravaId: number; // Strava ID of current owner
  currentOwnerIsPremium: boolean; // Is current owner a premium user (denormalized for performance)
  currentOwnerImghex?: string; // Current owner's profile image (denormalized for performance)
  currentActivityId: Types.ObjectId; // Activity that captured this hex
  currentStravaActivityId: number; // Strava activity ID

  // Capture statistics
  captureCount: number; // How many times this hex has been captured (1 = first capture)

  // Capture metadata
  firstCapturedAt: Date; // When this hex was first captured by anyone
  firstCapturedBy: Types.ObjectId; // Original capturer
  lastCapturedAt: Date; // When this hex was most recently captured

  // Activity context for current capture
  activityType: string; // "Run", "TrailRun", etc.
  routeType?: 'line' | 'area'; // Was this from a loop or linear route

  // Capture history (optional - for showing previous owners)
  captureHistory: ICaptureHistoryEntry[];

  // Timestamps (auto-managed by Mongoose)
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema
const hexagonSchema = new Schema<IHexagon>(
  {
    hexagonId: {
      type: String,
      required: true,
      unique: true, // Global uniqueness - only one owner per hex
      index: true,
    },
    parentHexagonId: {
      type: String,
      required: false, // Optional for backward compatibility
      index: true, // Index for fast parent-based queries
    },
    currentOwnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true, // For querying all hexes owned by a user
    },
    currentOwnerStravaId: {
      type: Number,
      required: true,
    },
    currentOwnerIsPremium: {
      type: Boolean,
      required: false,
      default: false,
    },
    currentOwnerImghex: {
      type: String,
      required: false,
      default: undefined,
    },
    currentActivityId: {
      type: Schema.Types.ObjectId,
      ref: 'Activity',
      required: true,
    },
    currentStravaActivityId: {
      type: Number,
      required: true,
    },
    captureCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    firstCapturedAt: {
      type: Date,
      required: true,
    },
    firstCapturedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastCapturedAt: {
      type: Date,
      required: true,
    },
    activityType: {
      type: String,
      required: true,
    },
    routeType: {
      type: String,
      enum: ['line', 'area'],
    },
    captureHistory: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          stravaId: { type: Number, required: true },
          activityId: { type: Schema.Types.ObjectId, ref: 'Activity', required: true },
          stravaActivityId: { type: Number, required: true },
          capturedAt: { type: Date, required: true },
          activityType: { type: String, required: true },
          _id: false, // Don't create _id for subdocuments
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound indexes for efficient queries
hexagonSchema.index({ currentOwnerId: 1, lastCapturedAt: -1 }); // User's hexes sorted by recent
hexagonSchema.index({ captureCount: -1 }); // Most contested hexes
hexagonSchema.index({ firstCapturedAt: 1 }); // Oldest hexes

// Create and export the model
export const Hexagon = mongoose.model<IHexagon>('Hexagon', hexagonSchema);
