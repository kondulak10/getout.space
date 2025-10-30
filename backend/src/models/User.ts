import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interface for User
export interface IUser extends Document {
  name: string;
  img: string;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    img: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Create and export the model
export const User = mongoose.model<IUser>('User', userSchema);
