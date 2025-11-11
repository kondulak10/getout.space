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
		timestamps: true,
	}
);

userSchema.pre('save', function (next) {
	if (this.isModified('accessToken')) {
		this.accessToken = encrypt(this.accessToken);
	}
	if (this.isModified('refreshToken')) {
		this.refreshToken = encrypt(this.refreshToken);
	}
	next();
});

// Helper function to decrypt tokens on a single user document
function decryptUserTokens(doc: IUser) {
	try {
		if (doc.accessToken && doc.accessToken.includes(':')) {
			doc.accessToken = decrypt(doc.accessToken);
		}
	} catch (error) {
		console.error(
			'Failed to decrypt accessToken for user:',
			doc._id,
			'- token may be in old format or corrupted'
		);
	}

	try {
		if (doc.refreshToken && doc.refreshToken.includes(':')) {
			doc.refreshToken = decrypt(doc.refreshToken);
		}
	} catch (error) {
		console.error(
			'Failed to decrypt refreshToken for user:',
			doc._id,
			'- token may be in old format or corrupted'
		);
	}
}

// post('init') hook - fires when each document is loaded from DB
// Should cover all queries, but can be unreliable in practice
userSchema.post('init', function (doc) {
	decryptUserTokens(doc);
});

// post('findOne', 'findById') hook - explicit coverage for single-doc queries
// Ensures decryption happens even if post('init') doesn't fire
userSchema.post(['findOne', 'findById'], function (doc) {
	if (doc) {
		decryptUserTokens(doc);
	}
});

// post('find') hook - handles array results from User.find()
// post('find') receives an array of documents, not individual docs
userSchema.post('find', function (docs) {
	if (Array.isArray(docs)) {
		docs.forEach((doc) => decryptUserTokens(doc));
	}
});

export const User = mongoose.model<IUser>('User', userSchema);
