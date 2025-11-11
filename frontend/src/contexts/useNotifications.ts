import { useContext } from 'react';
import { NotificationContext } from './NotificationContext';

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotifications must be used within NotificationProvider');
	}
	return context;
}
