import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
	MY_UNREAD_NOTIFICATION_COUNT,
	MY_NOTIFICATIONS,
	MARK_NOTIFICATION_AS_READ,
	MARK_ALL_NOTIFICATIONS_AS_READ,
	DELETE_NOTIFICATION,
} from '@/graphql/notifications';
import { useAuth } from '@/contexts/useAuth';

interface Notification {
	id: string;
	type: 'positive' | 'negative' | 'neutral';
	message: string;
	read: boolean;
	relatedActivityId?: string;
	createdAt: string;
}

interface NotificationContextType {
	unreadCount: number;
	notifications: Notification[];
	loading: boolean;
	refetch: () => void;
	markAsRead: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated } = useAuth();

	// Query for unread count with polling every 30 seconds
	const { data: countData, refetch: refetchCount } = useQuery(MY_UNREAD_NOTIFICATION_COUNT, {
		skip: !isAuthenticated,
		pollInterval: 30000, // Poll every 30 seconds
		fetchPolicy: 'network-only', // Always fetch fresh data
	});

	// Query for recent notifications (for dropdown)
	const {
		data: notificationsData,
		loading,
		refetch: refetchNotifications,
	} = useQuery(MY_NOTIFICATIONS, {
		variables: { limit: 20 },
		skip: !isAuthenticated,
		fetchPolicy: 'cache-and-network', // Use cache but also fetch fresh data
	});

	// Mutations
	const [markAsReadMutation] = useMutation(MARK_NOTIFICATION_AS_READ, {
		refetchQueries: [MY_UNREAD_NOTIFICATION_COUNT, MY_NOTIFICATIONS],
	});

	const [markAllAsReadMutation] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ, {
		refetchQueries: [MY_UNREAD_NOTIFICATION_COUNT, MY_NOTIFICATIONS],
	});

	const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION, {
		refetchQueries: [MY_UNREAD_NOTIFICATION_COUNT, MY_NOTIFICATIONS],
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

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within NotificationProvider');
	}
	return context;
}
