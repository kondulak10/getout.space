import Notification from '../models/Notification';
import mongoose from 'mongoose';

export const notificationService = {
	async createActivityNotification(
		userId: string | mongoose.Types.ObjectId,
		activityId: string | mongoose.Types.ObjectId,
		stats: { newHexCount: number; stolenCount: number }
	) {
		const { newHexCount, stolenCount } = stats;

		if (newHexCount === 0 && stolenCount === 0) {
			return null;
		}

		let message: string;

		if (newHexCount > 0 && stolenCount > 0) {
			message = `Congratulations on your newest activity! You discovered ${newHexCount} new hex${newHexCount > 1 ? 'es' : ''} and stole ${stolenCount} from others!`;
		} else if (newHexCount > 0) {
			message = `Congratulations! You discovered ${newHexCount} new hex${newHexCount > 1 ? 'es' : ''}!`;
		} else {
			message = `Your activity captured ${stolenCount} hex${stolenCount > 1 ? 'es' : ''} from other users!`;
		}

		const notification = await Notification.create({
			ownerId: userId,
			triggeredById: userId,
			type: 'positive',
			message,
			relatedActivityId: activityId,
			read: false,
		});

		return notification;
	},

	async createStolenNotification(
		affectedUserId: string | mongoose.Types.ObjectId,
		thiefId: string | mongoose.Types.ObjectId,
		thiefName: string,
		stolenCount: number,
		activityId: string | mongoose.Types.ObjectId
	) {
		const message = `${thiefName} just stole ${stolenCount} hex${stolenCount > 1 ? 'es' : ''} from you!`;

		const notification = await Notification.create({
			ownerId: affectedUserId,
			triggeredById: thiefId,
			type: 'negative',
			message,
			relatedActivityId: activityId,
			read: false,
		});

		return notification;
	},

	async getNotifications(
		userId: string | mongoose.Types.ObjectId,
		options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
	) {
		const { limit = 20, offset = 0, unreadOnly = false } = options;

		const query: { ownerId: string | mongoose.Types.ObjectId; read?: boolean } = {
			ownerId: userId,
		};
		if (unreadOnly) {
			query.read = false;
		}

		return await Notification.find(query).sort({ createdAt: -1 }).limit(limit).skip(offset).lean();
	},

	async getAllNotifications(options: { limit?: number; offset?: number } = {}) {
		const { limit = 20, offset = 0 } = options;

		return await Notification.find().sort({ createdAt: -1 }).limit(limit).skip(offset).lean();
	},

	async getNotificationsCount() {
		return await Notification.countDocuments();
	},

	async getUnreadCount(userId: string | mongoose.Types.ObjectId) {
		return await Notification.countDocuments({
			ownerId: userId,
			read: false,
		});
	},

	async markAsRead(notificationId: string, userId: string | mongoose.Types.ObjectId) {
		const notification = await Notification.findOne({
			_id: notificationId,
			ownerId: userId,
		});

		if (!notification) {
			throw new Error('Notification not found');
		}

		notification.read = true;
		return await notification.save();
	},

	async markAllAsRead(userId: string | mongoose.Types.ObjectId) {
		const result = await Notification.updateMany(
			{ ownerId: userId, read: false },
			{ $set: { read: true } }
		);

		return result.modifiedCount;
	},

	async deleteNotification(notificationId: string, userId: string | mongoose.Types.ObjectId) {
		const result = await Notification.deleteOne({
			_id: notificationId,
			ownerId: userId,
		});

		return result.deletedCount > 0;
	},

	async deleteNotificationAdmin(notificationId: string) {
		const result = await Notification.deleteOne({ _id: notificationId });
		return result.deletedCount > 0;
	},
};
