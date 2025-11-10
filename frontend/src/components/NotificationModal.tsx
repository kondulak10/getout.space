import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faBell, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/contexts/NotificationProvider';

interface NotificationModalProps {
	onClose: () => void;
}

export function NotificationModal({ onClose }: NotificationModalProps) {
	const { notifications, loading, unreadCount, markAllAsRead, refetch } = useNotifications();

	// Refetch notifications when modal opens
	useEffect(() => {
		console.log('📬 NotificationModal opened - refetching notifications...');
		refetch();
	}, [refetch]);

	const handleClose = () => {
		try {
			onClose();
		} catch (error) {
			console.error('Error closing notification modal:', error);
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onClick={handleClose}
		>
			<div
				className="bg-gradient-to-b from-[rgba(10,10,10,0.98)] to-[rgba(5,5,5,0.98)] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-[rgba(10,10,10,0.98)] backdrop-blur-md z-10">
					<div className="flex items-center gap-2">
						<FontAwesomeIcon icon={faBell} className="w-5 h-5 text-orange-500" />
						<h2 className="text-lg font-bold text-gray-100">Notifications</h2>
						{unreadCount > 0 && (
							<span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
								{unreadCount > 9 ? '9+' : unreadCount}
							</span>
						)}
					</div>
					<div className="flex items-center gap-3">
						{unreadCount > 0 && (
							<button
								onClick={markAllAsRead}
								className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
							>
								Mark all as read
							</button>
						)}
						<button
							type="button"
							onClick={handleClose}
							className="text-gray-400 hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-lg"
						>
							<FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
						</button>
					</div>
				</div>

				<div className="p-5">
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<FontAwesomeIcon icon={faSpinner} spin className="w-8 h-8 text-orange-500" />
						</div>
					) : notifications.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							<FontAwesomeIcon icon={faBell} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
							<p>No notifications yet</p>
						</div>
					) : (
						<div className="space-y-2">
							{notifications.map((notification) => (
								<NotificationItem
									key={notification.id}
									notification={notification}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

