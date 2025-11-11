import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/pro-solid-svg-icons';
import { useNotifications } from '@/contexts/useNotifications';

interface NotificationBellProps {
	className?: string;
	iconClassName?: string;
	onClick?: () => void;
	showLabel?: boolean;
}

export function NotificationBell({ className, iconClassName, onClick, showLabel = false }: NotificationBellProps) {
	const { unreadCount } = useNotifications();

	console.log('🔔 NotificationBell rendering, unreadCount:', unreadCount);

	const defaultClassName = "relative p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 border border-gray-300";
	const defaultIconClassName = "text-xl";

	return (
		<button onClick={onClick} className={className || defaultClassName}>
			<div className="relative inline-flex">
				<FontAwesomeIcon icon={faBell} className={iconClassName || defaultIconClassName} />
				{unreadCount > 0 && (
					<span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
						{unreadCount > 9 ? '9+' : unreadCount}
					</span>
				)}
			</div>
			{showLabel && <span className="text-[10px] font-medium">Alerts</span>}
		</button>
	);
}
