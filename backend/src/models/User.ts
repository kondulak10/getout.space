import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for Strava Profile
export interface IStravaProfile {
  firstname: string;
  lastname: string;
  profile: string; // Profile picture URL
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  username?: string;
}

// TypeScript interface for User
export interface IUser extends Document {
  stravaId: number;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  isAdmin: boolean;
  stravaProfile: IStravaProfile;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema
const stravaProfileSchema = new Schema<IStravaProfile>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    profile: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    sex: { type: String },
    username: { type: String },
  },
  { _id: false } // Don't create separate _id for subdocument
);

const userSchema = new Schema<IUser>(
  {
    stravaId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    tokenExpiresAt: {
      type: Number,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    stravaProfile: {
      type: stravaProfileSchema,
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);
