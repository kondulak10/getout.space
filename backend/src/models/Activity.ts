import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;

  stravaActivityId: number;
  userId: mongoose.Types.ObjectId;

  source: 'webhook' | 'api';

  name: string;
  type: string;
  sportType?: string;
  description?: string;

  startDate: Date;
  startDateLocal: Date;
  timezone?: string;
  movingTime: number;
  elapsedTime: number;

  distance: number;
  elevationGain: number;
  averageSpeed: number;

  startLocation?: {
    lat: number;
    lng: number;
  };
  endLocation?: {
    lat: number;
    lng: number;
  };

  summaryPolyline?: string;

  isManual: boolean;
  isPrivate: boolean;

  lastHex?: string;

  createdAt: Date;
  updatedAt: Date;
}

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
      index: true,
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
    lastHex: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ userId: 1, startDate: -1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);
