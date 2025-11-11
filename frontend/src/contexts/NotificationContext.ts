import { createContext } from 'react';

export interface NotificationContextType {
	unreadCount: number;
	notifications: Notification[];
	loading: boolean;
	refetch: () => void;
	markAsRead: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
}

interface Notification {
	id: string;
	type: 'positive' | 'negative' | 'neutral';
	message: string;
	read: boolean;
	relatedActivityId: string | null;
	createdAt: unknown;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
