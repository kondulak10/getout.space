import { gql } from '@apollo/client';

export const NOTIFICATION_FRAGMENT = gql`
	fragment NotificationFields on Notification {
		id
		type
		message
		read
		relatedActivityId
		createdAt
	}
`;

export const MY_NOTIFICATIONS = gql`
	${NOTIFICATION_FRAGMENT}
	query MyNotifications($limit: Int, $offset: Int, $unreadOnly: Boolean) {
		myNotifications(limit: $limit, offset: $offset, unreadOnly: $unreadOnly) {
			...NotificationFields
		}
	}
`;

export const MY_UNREAD_NOTIFICATION_COUNT = gql`
	query MyUnreadNotificationCount {
		myUnreadNotificationCount
	}
`;

export const MARK_NOTIFICATION_AS_READ = gql`
	${NOTIFICATION_FRAGMENT}
	mutation MarkNotificationAsRead($id: ID!) {
		markNotificationAsRead(id: $id) {
			...NotificationFields
		}
	}
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
	mutation MarkAllNotificationsAsRead {
		markAllNotificationsAsRead
	}
`;

export const DELETE_NOTIFICATION = gql`
	mutation DeleteNotification($id: ID!) {
		deleteNotification(id: $id)
	}
`;

// Admin queries
export const ALL_NOTIFICATIONS = gql`
	${NOTIFICATION_FRAGMENT}
	query AllNotifications($limit: Int, $offset: Int) {
		notifications(limit: $limit, offset: $offset) {
			...NotificationFields
		}
	}
`;

export const NOTIFICATIONS_COUNT = gql`
	query NotificationsCount {
		notificationsCount
	}
`;
