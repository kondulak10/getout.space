import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faSpinner, faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/contexts/useNotifications';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';

interface NotificationModalProps {
	onClose: () => void;
}

const NOTIFICATIONS_PER_PAGE = 5;

export function NotificationModal({ onClose }: NotificationModalProps) {
	const { notifications, loading, unreadCount, markAllAsRead, refetch } = useNotifications();
	const { track } = useAnalytics();
	const [currentPage, setCurrentPage] = useState(1);

	// Track modal opened and refetch notifications when modal opens
	useEffect(() => {
		track('notifications_opened', {});
		refetch();
	}, [refetch, track]);

	// Auto-mark all notifications as read when modal opens
	useEffect(() => {
		markAllAsRead();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run once on mount

	
	const totalPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE);
	const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE;
	const endIndex = startIndex + NOTIFICATIONS_PER_PAGE;
	const paginatedNotifications = notifications.slice(startIndex, endIndex);

	
	useEffect(() => {
		if (currentPage > totalPages && totalPages > 0) {
			setCurrentPage(1);
		}
	}, [currentPage, totalPages]);

	const handleClose = () => {
		track('notifications_closed', {});
		onClose();
	};

	return (
		<Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent>
				<DialogHeader className="pr-20">
					<DialogTitle className="flex items-center gap-2">
						<FontAwesomeIcon icon={faBell} className="w-5 h-5 text-orange-500" />
						Alerts
						{unreadCount > 0 && (
							<span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
								{unreadCount > 9 ? '9+' : unreadCount}
							</span>
						)}
					</DialogTitle>
					{unreadCount > 0 && (
						<button
							onClick={markAllAsRead}
							className="absolute right-20 top-5 text-sm text-orange-400 hover:text-orange-300 hover:underline transition-colors px-2 py-1 rounded"
						>
							Mark all as read
						</button>
					)}
				</DialogHeader>

				<DialogBody>
					{loading ? (
						<div className="flex items-center justify-center py-12">
							<FontAwesomeIcon icon={faSpinner} spin className="w-8 h-8 text-orange-500" />
						</div>
					) : notifications.length === 0 ? (
						<div className="text-center py-12 text-gray-400">
							<FontAwesomeIcon icon={faBell} className="w-12 h-12 text-gray-600 mx-auto mb-3" />
							<p>No alerts yet</p>
						</div>
					) : (
						<>
							<div className="space-y-2">
								{paginatedNotifications.map((notification) => (
									<NotificationItem
										key={notification.id}
										notification={notification}
									/>
								))}
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
									<button
										onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
										disabled={currentPage === 1}
										className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-orange-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
									>
										<FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
										Previous
									</button>

									<span className="text-sm text-gray-400">
										Page {currentPage} of {totalPages}
									</span>

									<button
										onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
										disabled={currentPage === totalPages}
										className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-orange-400 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
									>
										Next
										<FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
									</button>
								</div>
							)}
						</>
					)}
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
}

