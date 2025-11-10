import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
	ownerId: mongoose.Types.ObjectId;
	triggeredById?: mongoose.Types.ObjectId;
	type: 'positive' | 'negative' | 'neutral';
	message: string;
	relatedActivityId?: mongoose.Types.ObjectId;
	read: boolean;
	createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
	ownerId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
		index: true,
	},
	triggeredById: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		index: true,
	},
	type: {
		type: String,
		enum: ['positive', 'negative', 'neutral'],
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	relatedActivityId: {
		type: Schema.Types.ObjectId,
		ref: 'Activity',
	},
	read: {
		type: Boolean,
		default: false,
		index: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		index: true,
	},
});

// Compound index for fast "get my unread notifications" query
notificationSchema.index({ ownerId: 1, read: 1, createdAt: -1 });

// TTL index - auto-delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
