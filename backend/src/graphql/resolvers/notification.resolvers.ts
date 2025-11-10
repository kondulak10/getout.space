import { notificationService } from '../../services/notification.service';
import { requireAuth, requireAdmin } from './auth.helpers';

export const notificationResolvers = {
	Query: {
		// User queries
		myNotifications: async (_: any, args: any, context: any) => {
			requireAuth(context);
			return await notificationService.getNotifications(context.userId, args);
		},

		myUnreadNotificationCount: async (_: any, __: any, context: any) => {
			requireAuth(context);
			return await notificationService.getUnreadCount(context.userId);
		},

		// Admin queries
		notifications: async (_: any, args: any, context: any) => {
			requireAdmin(context);
			return await notificationService.getAllNotifications(args);
		},

		notificationsCount: async (_: any, __: any, context: any) => {
			requireAdmin(context);
			return await notificationService.getNotificationsCount();
		},
	},

	Mutation: {
		markNotificationAsRead: async (_: any, { id }: any, context: any) => {
			requireAuth(context);
			return await notificationService.markAsRead(id, context.userId);
		},

		markAllNotificationsAsRead: async (_: any, __: any, context: any) => {
			requireAuth(context);
			return await notificationService.markAllAsRead(context.userId);
		},

		deleteNotification: async (_: any, { id }: any, context: any) => {
			requireAuth(context);
			return await notificationService.deleteNotification(id, context.userId);
		},
	},

	Notification: {
		id: (notification: any) => notification._id.toString(),
		relatedActivityId: (notification: any) => notification.relatedActivityId?.toString(),
	},
};
