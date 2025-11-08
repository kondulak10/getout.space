import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

// TypeScript interface for Strava Profile
export interface IStravaProfile {
  firstname: string;
  lastname: string;
  profile?: string; // Profile picture URL (optional - user may have no photo)
  imghex?: string; // Hexagon-clipped profile picture (base64 or URL)
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  username?: string;
}

// TypeScript interface for User
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  stravaId: number;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: number;
  isAdmin: boolean;
  isPremium: boolean;
  stravaProfile: IStravaProfile;
  lastHex?: string; // Resolution 6 parent hex from most recent activity
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema
const stravaProfileSchema = new Schema<IStravaProfile>(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    profile: { type: String }, // Optional - user may have no profile photo
    imghex: { type: String }, // Hexagon-clipped profile picture
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
    isPremium: {
      type: Boolean,
      default: false,
    },
    stravaProfile: {
      type: stravaProfileSchema,
      required: true,
    },
    lastHex: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Mongoose middleware: Encrypt tokens before saving to database
userSchema.pre('save', function (next) {
  // Only encrypt if tokens are modified (new or updated)
  if (this.isModified('accessToken')) {
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken')) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  next();
});

// Mongoose middleware: Decrypt tokens after loading from database
userSchema.post('init', function (doc) {
  // Decrypt tokens when document is loaded from DB
  try {
    // Check if token looks encrypted (has the iv:authTag:data format)
    if (doc.accessToken && doc.accessToken.includes(':')) {
      doc.accessToken = decrypt(doc.accessToken);
    }
  } catch (error) {
    console.error('Failed to decrypt accessToken for user:', doc._id, '- token may be in old format or corrupted');
  }

  try {
    // Check if token looks encrypted (has the iv:authTag:data format)
    if (doc.refreshToken && doc.refreshToken.includes(':')) {
      doc.refreshToken = decrypt(doc.refreshToken);
    }
  } catch (error) {
    console.error('Failed to decrypt refreshToken for user:', doc._id, '- token may be in old format or corrupted');
  }
});

// Mongoose middleware: Decrypt tokens after findOne, findOneAndUpdate, etc.
userSchema.post('findOne', function (doc) {
  if (doc) {
    try {
      // Check if token looks encrypted (has the iv:authTag:data format)
      if (doc.accessToken && doc.accessToken.includes(':')) {
        doc.accessToken = decrypt(doc.accessToken);
      }
    } catch (error) {
      console.error('Failed to decrypt accessToken for user:', doc._id, '- token may be in old format or corrupted');
    }

    try {
      // Check if token looks encrypted (has the iv:authTag:data format)
      if (doc.refreshToken && doc.refreshToken.includes(':')) {
        doc.refreshToken = decrypt(doc.refreshToken);
      }
    } catch (error) {
      console.error('Failed to decrypt refreshToken for user:', doc._id, '- token may be in old format or corrupted');
    }
  }
});

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);
