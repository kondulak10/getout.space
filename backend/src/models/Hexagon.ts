import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICaptureHistoryEntry {
	userId: Types.ObjectId;
	stravaId: number;
	activityId: Types.ObjectId;
	stravaActivityId: number;
	capturedAt: Date;
	activityType: string;
}

export interface IHexagon extends Document {
	_id: Types.ObjectId;

	hexagonId: string;
	parentHexagonId: string;

	currentOwnerId: Types.ObjectId;
	currentOwnerStravaId: number;
	currentOwnerIsPremium: boolean;
	currentOwnerImghex?: string;
	currentActivityId: Types.ObjectId;
	currentStravaActivityId: number;

	captureCount: number;

	firstCapturedAt: Date;
	firstCapturedBy: Types.ObjectId;
	lastCapturedAt: Date;

	// Denormalized field for efficient "stolen from" queries
	// Stores the userId of the immediate previous owner (last entry in captureHistory)
	lastPreviousOwnerId?: Types.ObjectId;

	activityType: string;
	routeType?: 'line' | 'area';

	captureHistory: ICaptureHistoryEntry[];

	createdAt: Date;
	updatedAt: Date;
}

const hexagonSchema = new Schema<IHexagon>(
	{
		hexagonId: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		parentHexagonId: {
			type: String,
			required: false,
			index: true,
		},
		currentOwnerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
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
		lastPreviousOwnerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: false,
			index: true,
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
					_id: false,
				},
			],
			default: [],
		},
	},
	{
		timestamps: true,
	}
);

hexagonSchema.index({ currentOwnerId: 1, lastCapturedAt: -1 });
hexagonSchema.index({ captureCount: -1 });
hexagonSchema.index({ firstCapturedAt: 1 });

export const Hexagon = mongoose.model<IHexagon>('Hexagon', hexagonSchema);
