import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCheckCircle,
	faExclamationTriangle,
	faInfoCircle,
	faUser,
} from '@fortawesome/pro-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import type { Notification } from '@/contexts/NotificationContext';

const typeConfig = {
	positive: {
		icon: faCheckCircle,
		color: 'text-green-400',
		bg: 'bg-gradient-to-r from-green-500/20 to-transparent',
		border: 'border-green-500/30',
	},
	negative: {
		icon: faExclamationTriangle,
		color: 'text-red-400',
		bg: 'bg-gradient-to-r from-red-500/20 to-transparent',
		border: 'border-red-500/30',
	},
	neutral: {
		icon: faInfoCircle,
		color: 'text-orange-400',
		bg: 'bg-gradient-to-r from-orange-500/20 to-transparent',
		border: 'border-orange-500/30',
	},
};

interface NotificationItemProps {
	notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
	const config = typeConfig[notification.type];
	const navigate = useNavigate();

	const triggeredBy = notification.triggeredBy;
	const hasThief = notification.type === 'negative' && triggeredBy;

	// Build display name for thief
	const thiefName = triggeredBy
		? triggeredBy.stravaProfile.lastname
			? `${triggeredBy.stravaProfile.firstname} ${triggeredBy.stravaProfile.lastname.charAt(0).toUpperCase()}.`
			: triggeredBy.stravaProfile.firstname
		: null;

	const handleClick = () => {
		if (hasThief) {
			navigate(`/profile/${triggeredBy.id}`);
		}
	};

	return (
		<div
			className={`rounded-lg p-3 transition-all border ${config.bg} ${config.border} ${
				!notification.read ? 'ring-1 ring-orange-500/50' : ''
			} ${hasThief ? 'cursor-pointer hover:brightness-110' : ''}`}
			onClick={handleClick}
		>
			<div className="flex items-center gap-3">
				{/* Avatar or Icon */}
				{hasThief && triggeredBy.stravaProfile.imghex ? (
					<div className="flex-shrink-0">
						<img
							src={triggeredBy.stravaProfile.imghex}
							alt={thiefName || 'User'}
							className="w-10 h-10 object-cover"
						/>
					</div>
				) : hasThief ? (
					<div className="flex-shrink-0">
						<div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/30 border-2 border-red-500/40 flex items-center justify-center">
							<FontAwesomeIcon icon={faUser} className="w-5 h-5 text-red-400" />
						</div>
					</div>
				) : (
					<div
						className={`rounded-full p-2 h-10 w-10 flex items-center justify-center flex-shrink-0 ${
							notification.type === 'positive'
								? 'bg-green-500/20'
								: notification.type === 'negative'
									? 'bg-red-500/20'
									: 'bg-orange-500/20'
						}`}
					>
						<FontAwesomeIcon icon={config.icon} className={`w-5 h-5 ${config.color}`} />
					</div>
				)}

				{/* Content */}
				<div className="flex-1 min-w-0">
					{hasThief ? (
						<p className="text-sm text-gray-200">
							<span className="font-bold text-red-400">{thiefName}</span>{' '}
							<span className="text-gray-300">
								{/* Parse count from message: "{name} just stole {count} hex(es) from you!" */}
								{notification.message.match(/just stole (\d+) hex/)?.[0]?.replace('just ', '') || 'stole hexes'} from you!
							</span>
						</p>
					) : (
						<p className="text-sm text-gray-200">{notification.message}</p>
					)}
					<p className="text-xs text-gray-500 mt-1">
						{formatDistanceToNow(new Date(notification.createdAt as string), { addSuffix: true })}
					</p>
				</div>

				{/* Unread indicator */}
				{!notification.read && (
					<div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" title="Unread"></div>
				)}
			</div>
		</div>
	);
}
