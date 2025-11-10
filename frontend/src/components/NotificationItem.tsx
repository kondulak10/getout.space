import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheckCircle,
	faExclamationTriangle,
	faInfoCircle,
	faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import { useNotifications } from '@/contexts/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const typeConfig = {
	positive: { icon: faCheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
	negative: { icon: faExclamationTriangle, color: 'text-red-400', bg: 'bg-red-400/10' },
	neutral: { icon: faInfoCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
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
	onClose: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
	const { markAsRead, deleteNotification } = useNotifications();
	const navigate = useNavigate();
	const config = typeConfig[notification.type];

	const handleClick = async () => {
		if (!notification.read) {
			await markAsRead(notification.id);
		}

		// Navigate to activity if linked
		if (notification.relatedActivityId) {
			navigate(`/activity/${notification.relatedActivityId}`);
			onClose();
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation();
		await deleteNotification(notification.id);
	};

	return (
		<div
			className={`p-4 border-b border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors ${
				!notification.read ? 'bg-gray-800/50' : ''
			}`}
			onClick={handleClick}
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

				<button
					onClick={handleDelete}
					className="text-gray-500 hover:text-red-400 p-1 transition-colors"
					title="Delete notification"
				>
					<FontAwesomeIcon icon={faTrash} className="text-sm" />
				</button>

				{!notification.read && (
					<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" title="Unread"></div>
				)}
			</div>
		</div>
	);
}
