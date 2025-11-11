import { ReactNode } from 'react';
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

	// Query for unread count with polling every 30 seconds
	const { data: countData, refetch: refetchCount } = useQuery(MyUnreadNotificationCountDocument, {
		skip: !isAuthenticated,
		pollInterval: 30000, // Poll every 30 seconds
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

	const markAsRead = async (id: string) => {
		await markAsReadMutation({ variables: { id } });
	};

	const markAllAsRead = async () => {
		await markAllAsReadMutation();
	};

	const deleteNotification = async (id: string) => {
		await deleteNotificationMutation({ variables: { id } });
	};

	const refetch = () => {
		refetchCount();
		refetchNotifications();
	};

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
