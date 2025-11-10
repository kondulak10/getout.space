import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/pro-solid-svg-icons';
import { useNotifications } from '@/contexts/NotificationProvider';

export function NotificationBell() {
	const { unreadCount } = useNotifications();

	console.log('🔔 NotificationBell rendering, unreadCount:', unreadCount);

	return (
		<button className="relative p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 border border-gray-300">
			<FontAwesomeIcon icon={faBell} className="text-xl" />
			{unreadCount > 0 && (
				<span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
			)}
		</button>
	);
}
