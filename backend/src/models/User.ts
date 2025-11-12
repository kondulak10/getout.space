import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption';

export interface IStravaProfile {
	firstname: string;
	lastname: string;
	profile?: string;
	imghex?: string;
	city?: string;
	state?: string;
	country?: string;
	sex?: string;
	username?: string;
}

export interface IUser extends Document {
	_id: mongoose.Types.ObjectId;
	stravaId: number;
	accessToken: string;
	refreshToken: string;
	tokenExpiresAt: number;
	isAdmin: boolean;
	isPremium: boolean;
	stravaProfile: IStravaProfile;
	lastHex?: string;
	createdAt: Date;
	updatedAt: Date;
}

const stravaProfileSchema = new Schema<IStravaProfile>(
	{
		firstname: { type: String, required: true },
		lastname: { type: String, required: true },
		profile: { type: String },
		imghex: { type: String },
		city: { type: String },
		state: { type: String },
		country: { type: String },
		sex: { type: String },
		username: { type: String },
	},
	{ _id: false }
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
			set: (value: string) => {
				// Only encrypt if not already encrypted (encrypted tokens contain ':')
				if (value && !value.includes(':')) {
					return encrypt(value);
				}
				return value;
			},
			get: (value: string) => {
				// Only decrypt if encrypted (encrypted tokens contain ':')
				if (value && value.includes(':')) {
					try {
						return decrypt(value);
					} catch (error) {
						console.error('Failed to decrypt accessToken - token may be corrupted');
						return value;
					}
				}
				return value;
			},
		},
		refreshToken: {
			type: String,
			required: true,
			set: (value: string) => {
				// Only encrypt if not already encrypted
				if (value && !value.includes(':')) {
					return encrypt(value);
				}
				return value;
			},
			get: (value: string) => {
				// Only decrypt if encrypted
				if (value && value.includes(':')) {
					try {
						return decrypt(value);
					} catch (error) {
						console.error('Failed to decrypt refreshToken - token may be corrupted');
						return value;
					}
				}
				return value;
			},
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
		timestamps: true,
		toJSON: { getters: false }, // Don't expose tokens in JSON
		toObject: { getters: true }, // Enable getters when accessing as object
	}
);

// Note: Token encryption/decryption is now handled by getters and setters
// Setters encrypt on assignment (before save)
// Getters decrypt on access (after load)
// This is more reliable than hooks and prevents the bug where tokens
// remain encrypted in memory after save()

export const User = mongoose.model<IUser>('User', userSchema);
