import { createContext } from 'react';

export interface TriggeredByUser {
	id: string;
	stravaId: number;
	stravaProfile: {
		firstname: string;
		lastname?: string | null;
		imghex?: string | null;
	};
}

export interface Notification {
	id: string;
	type: 'positive' | 'negative' | 'neutral';
	message: string;
	read: boolean;
	relatedActivityId: string | null;
	triggeredBy?: TriggeredByUser | null;
	createdAt: unknown;
}

export interface NotificationContextType {
	unreadCount: number;
	notifications: Notification[];
	loading: boolean;
	refetch: () => void;
	markAsRead: (id: string) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (id: string) => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
