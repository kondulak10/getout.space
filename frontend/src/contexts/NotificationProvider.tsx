import { ReactNode, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
	MyUnreadNotificationCountDocument,
	MyNotificationsDocument,
	MarkNotificationAsReadDocument,
	MarkAllNotificationsAsReadDocument,
	DeleteNotificationDocument,
} from '@/gql/graphql';
import { useAuth } from '@/contexts/useAuth';
import { NotificationContext } from './NotificationContext';

export function NotificationProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();

	// Query for unread count on page load only
	const { data: countData, refetch: refetchCount } = useQuery(MyUnreadNotificationCountDocument, {
		skip: !isAuthenticated,
		fetchPolicy: 'network-only', // Always fetch fresh data
	});

	// Query for recent notifications (for dropdown)
	const {
		data: notificationsData,
		loading,
		refetch: refetchNotifications,
	} = useQuery(MyNotificationsDocument, {
		variables: { limit: 20 },
		skip: !isAuthenticated,
		fetchPolicy: 'network-only', // Always fetch fresh data, no cache
	});

	// Mutations
	const [markAsReadMutation] = useMutation(MarkNotificationAsReadDocument, {
		refetchQueries: [MyUnreadNotificationCountDocument, MyNotificationsDocument],
	});

	const [markAllAsReadMutation] = useMutation(MarkAllNotificationsAsReadDocument, {
		refetchQueries: [MyUnreadNotificationCountDocument, MyNotificationsDocument],
	});

	const [deleteNotificationMutation] = useMutation(DeleteNotificationDocument, {
		refetchQueries: [MyUnreadNotificationCountDocument, MyNotificationsDocument],
	});

	const markAsRead = useCallback(
		async (id: string) => {
			await markAsReadMutation({ variables: { id } });
		},
		[markAsReadMutation]
	);

	const markAllAsRead = useCallback(async () => {
		await markAllAsReadMutation();
	}, [markAllAsReadMutation]);

	const deleteNotification = useCallback(
		async (id: string) => {
			await deleteNotificationMutation({ variables: { id } });
		},
		[deleteNotificationMutation]
	);

	const refetch = useCallback(() => {
		refetchCount();
		refetchNotifications();
	}, [refetchCount, refetchNotifications]);

	return (
		<NotificationContext.Provider
			value={{
				unreadCount: countData?.myUnreadNotificationCount || 0,
				notifications: notificationsData?.myNotifications || [],
				loading,
				refetch,
				markAsRead,
				markAllAsRead,
				deleteNotification,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}
