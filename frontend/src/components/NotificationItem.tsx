import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheckCircle,
	faExclamationTriangle,
	faInfoCircle,
} from '@fortawesome/pro-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';

const typeConfig = {
	positive: { icon: faCheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
	negative: { icon: faExclamationTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
	neutral: { icon: faInfoCircle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

interface NotificationItemProps {
	notification: {
		id: string;
		type: 'positive' | 'negative' | 'neutral';
		message: string;
		read: boolean;
		relatedActivityId: string | null;
		createdAt: unknown;
	};
}

export function NotificationItem({ notification }: NotificationItemProps) {
	const config = typeConfig[notification.type];

	return (
		<div
			className={`p-4 border-b border-gray-700 transition-colors ${
				!notification.read ? 'bg-gray-800/50' : ''
			}`}
		>
			<div className="flex gap-3">
				<div
					className={`${config.bg} rounded-full p-2 h-10 w-10 flex items-center justify-center flex-shrink-0`}
				>
					<FontAwesomeIcon icon={config.icon} className={config.color} />
				</div>

				<div className="flex-1 min-w-0">
					<p className="text-sm text-gray-200">{notification.message}</p>
					<p className="text-xs text-gray-500 mt-1">
						{formatDistanceToNow(new Date(notification.createdAt as string), { addSuffix: true })}
					</p>
				</div>

				{!notification.read && (
					<div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2" title="Unread"></div>
				)}
			</div>
		</div>
	);
}
