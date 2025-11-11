import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/pro-solid-svg-icons';
import { useNotifications } from '@/contexts/useNotifications';

interface NotificationBellProps {
	className?: string;
	iconClassName?: string;
	onClick?: () => void;
}

export function NotificationBell({ className, iconClassName, onClick }: NotificationBellProps) {
	const { unreadCount } = useNotifications();

	console.log('🔔 NotificationBell rendering, unreadCount:', unreadCount);

	const defaultClassName = "relative p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 border border-gray-300";
	const defaultIconClassName = "text-xl";

	return (
		<button onClick={onClick} className={className || defaultClassName}>
			<FontAwesomeIcon icon={faBell} className={iconClassName || defaultIconClassName} />
			{unreadCount > 0 && (
				<span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
					{unreadCount > 9 ? '9+' : unreadCount}
				</span>
			)}
		</button>
	);
}
