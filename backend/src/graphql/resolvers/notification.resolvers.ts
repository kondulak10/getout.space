import { notificationService } from '../../services/notification.service';
import { GraphQLContext, requireAuth, requireAdmin } from './auth.helpers';
import { INotification } from '../../models/Notification';
import { PaginationArgs, IdArg } from './resolver.types';

export const notificationResolvers = {
	Query: {
		// User queries
		myNotifications: async (_: unknown, args: PaginationArgs, context: GraphQLContext) => {
			requireAuth(context);
			return await notificationService.getNotifications(context.userId!, args);
		},

		myUnreadNotificationCount: async (
			_: unknown,
			__: Record<string, never>,
			context: GraphQLContext
		) => {
			requireAuth(context);
			return await notificationService.getUnreadCount(context.userId!);
		},

		// Admin queries
		notifications: async (_: unknown, args: PaginationArgs, context: GraphQLContext) => {
			requireAdmin(context);
			return await notificationService.getAllNotifications(args);
		},

		notificationsCount: async (_: unknown, __: Record<string, never>, context: GraphQLContext) => {
			requireAdmin(context);
			return await notificationService.getNotificationsCount();
		},
	},

	Mutation: {
		markNotificationAsRead: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			requireAuth(context);
			return await notificationService.markAsRead(id, context.userId!);
		},

		markAllNotificationsAsRead: async (
			_: unknown,
			__: Record<string, never>,
			context: GraphQLContext
		) => {
			requireAuth(context);
			return await notificationService.markAllAsRead(context.userId!);
		},

		deleteNotification: async (_: unknown, { id }: IdArg, context: GraphQLContext) => {
			requireAuth(context);
			return await notificationService.deleteNotification(id, context.userId!);
		},
	},

	Notification: {
		id: (notification: INotification) => String(notification._id),
		relatedActivityId: (notification: INotification) =>
			notification.relatedActivityId ? String(notification.relatedActivityId) : null,
	},
};
